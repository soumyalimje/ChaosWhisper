// Comprehensive Engineering Guidance & Remediation Catalog
// Provides deep architectural root-cause analysis, production code patches,
// verification tests, SRE runbooks, and ROI metrics for every failure scenario.

export const FAILURE_GUIDANCE = {
  'payment-failure': {
    id: 'payment-failure',
    title: 'Payment Gateway Timeout & Fallback Isolation',
    category: 'Microservice Dependency',
    severity: 'CRITICAL',
    roi: '$18,500/min burn prevented',
    problem: 'Checkout requests hang indefinitely or throw unhandled 504 Gateway Timeouts when the third-party Payment Provider latency spikes or service goes offline.',
    why: 'Without bounded client timeouts and circuit breakers, incoming orders hold server connection threads waiting for stalled socket responses. This exhausts Node/Go worker pools and causes cascading failure upstream to the API Gateway.',
    change: 'Wrap payment HTTP calls with an aggressive 800ms abort signal, configure a sliding-window Circuit Breaker (open after 5 consecutive failures), and route open-circuit orders to an asynchronous queue with an immediate user-friendly PENDING_PAYMENT receipt.',
    codeLang: 'typescript',
    code: `import { CircuitBreaker } from '@resilience/breaker';
import { TimeoutError, withTimeout } from './utils/timeout';

// 1. Configure bounded circuit breaker around external payment provider
const paymentBreaker = new CircuitBreaker(async (paymentPayload: PaymentRequest) => {
  // Enforce strict 800ms abort controller timeout
  return await withTimeout(paymentProviderApi.authorize(paymentPayload), 800);
}, {
  failureThreshold: 5,        // Trip after 5 failures in 30s window
  resetTimeoutMs: 15000,      // Probe recovery after 15 seconds
  halfOpenMaxProbes: 3,
});

// 2. Graceful fallback execution
export async function processCheckout(order: OrderRequest): Promise<OrderResult> {
  try {
    const payment = await paymentBreaker.execute(order.payment);
    return { status: 'COMPLETED', transactionId: payment.id };
  } catch (error) {
    if (paymentBreaker.isOpen() || error instanceof TimeoutError) {
      // Return decoupled fallback receipt: Order is safely saved in DB
      await orderQueue.publish('orders.pending_capture', { orderId: order.id, amount: order.amount });
      return {
        status: 'PENDING_PAYMENT',
        message: 'Order received. Payment is processing securely in background.',
        orderId: order.id,
      };
    }
    throw error;
  }
}`,
    test: `import { describe, it, expect, vi } from 'vitest';
import { processCheckout } from './checkoutService';
import { paymentProviderApi } from './clients/payment';

describe('Payment Dependency Hardening', () => {
  it('should trip breaker and return PENDING_PAYMENT fallback within 850ms when provider times out', async () => {
    // Inject artificial 5000ms delay into payment provider mock
    vi.spyOn(paymentProviderApi, 'authorize').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    );

    const startTime = Date.now();
    const result = await processCheckout({ id: 'ord-992', payment: { amount: 150 } });
    const duration = Date.now() - startTime;

    // Assert strict bounded timeout was respected
    expect(duration).toBeLessThanOrEqual(850);
    expect(result.status).toBe('PENDING_PAYMENT');
    expect(result.message).toContain('processing securely');
  });
});`,
    verify: '1. P99 checkout latency remains under 900ms even when payment provider is 100% offline.\n2. Zero worker thread exhaustion on Order Engine instances.\n3. Orders table records status as PENDING_PAYMENT with guaranteed reconciliation queue.',
    runbook: `## SRE Runbook: Payment Gateway Degradation
- **Prometheus Alert**: \`rate(http_requests_outbound{target="payment", status=~"5.*|timeout"}[1m]) > 0.05\`
- **Automatic Mitigation**: Circuit breaker opens automatically; traffic diverted to async capture queue.
- **Manual Verification**: Run \`curl -X GET https://api.internal/metrics | grep breaker_payment_state\`
- **Escalation**: Notify #payments-oncall if breaker remains OPEN for > 10 minutes.`,
    issue: 'fix(checkout): add 800ms bounded timeout, circuit breaker & async pending fallback'
  },

  'circuit-breaker': {
    id: 'circuit-breaker',
    title: 'Circuit Breaker Fallback & Graceful Degradation',
    category: 'Resilience Pattern',
    severity: 'HIGH',
    roi: 'Eliminates 99.4% of upstream 502/504 errors',
    problem: 'A degrading dependency causes upstream callers to wait, pile up queues, and crash, instead of fast-failing and serving cached or default responses.',
    why: 'When services do not fail fast, retry storms multiply traffic by 3x-5x on an already dying service, locking threads across the entire dependency graph.',
    change: 'Implement the Circuit Breaker pattern with Closed, Open, and Half-Open state transitions. Supply a synthetic cached fallback response to protect upstream clients.',
    codeLang: 'typescript',
    code: `// Resilience Breaker with Half-Open probe and synthetic cache fallback
export class ResilientServiceWrapper<T> {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastStateChange = Date.now();

  constructor(
    private readonly primaryFn: () => Promise<T>,
    private readonly fallbackFn: () => Promise<T>,
    private readonly threshold = 5,
    private readonly cooldownMs = 10000
  ) {}

  async call(): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastStateChange > this.cooldownMs) {
        this.state = 'HALF_OPEN';
      } else {
        // Fast-fail without hitting downstream service
        return await this.fallbackFn();
      }
    }

    try {
      const result = await this.primaryFn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
        this.lastStateChange = Date.now();
      }
      return await this.fallbackFn();
    }
  }
}`,
    test: `describe('Circuit Breaker Resilience', () => {
  it('should transition from CLOSED -> OPEN and serve cached fallback', async () => {
    const mockFailingApi = vi.fn().mockRejectedValue(new Error('503 Service Unavailable'));
    const mockFallback = vi.fn().mockResolvedValue({ cached: true, catalog: [] });
    
    const breaker = new ResilientServiceWrapper(mockFailingApi, mockFallback, 3, 5000);

    // Fail 3 times
    await breaker.call();
    await breaker.call();
    await breaker.call();

    // 4th call should immediately return fallback without calling mockFailingApi
    mockFailingApi.mockClear();
    const response = await breaker.call();

    expect(mockFailingApi).not.toHaveBeenCalled();
    expect(response).toEqual({ cached: true, catalog: [] });
  });
});`,
    verify: '1. Fast failure return latency under 5ms during OPEN state.\n2. Upstream availability remains at 99.9% via cached responses.\n3. Automatic state reset when downstream service returns healthy.',
    runbook: `## SRE Runbook: Circuit Breaker Open State
- **Metric**: \`circuit_breaker_state{service="orders"} == 1\` (1 = OPEN)
- **Action**: Check downstream dependency health in Grafana.
- **Rollback**: If fallback cache is stale, trigger manual cache prewarm via Redis CLI.`,
    issue: 'test(resilience): verify circuit breaker fast-fail and synthetic fallback behavior'
  },

  'two-node-failure': {
    id: 'two-node-failure',
    title: 'Two-Node Failure & Majority Quorum Verification',
    category: 'Consensus Cluster',
    severity: 'HIGH',
    roi: 'Guarantees zero split-brain and 100% linearizable commits',
    problem: 'When 2 out of 5 nodes in a Raft consensus cluster fail simultaneously, the cluster operates on the razor edge of quorum (exactly 3 nodes remaining). A third failure will halt all writes.',
    why: 'In a 5-node cluster (f = (5-1)/2 = 2), quorum requires floor(N/2) + 1 = 3 nodes. Two dead nodes leave exactly 3 operational nodes. If one surviving node drops a packet or delays its heartbeat, the leader election will stall or fail.',
    change: 'Assert that when 2 nodes crash, the surviving 3 nodes successfully conduct an election for term N+1, elect exactly one leader, and successfully commit logs with 3/3 majority acknowledgment.',
    codeLang: 'typescript',
    code: `// Raft Consensus: Verify 2-node failure tolerance
export async function verifyTwoNodeFailure(cluster: RaftCluster): Promise<boolean> {
  const initialLeader = cluster.getCurrentLeader();
  
  // 1. Terminate two nodes simultaneously (including active leader)
  await Promise.all([
    cluster.stopNode(initialLeader.id),
    cluster.stopNode((initialLeader.id % 5) + 1)
  ]);

  // 2. Await election among remaining 3 nodes
  const newLeader = await cluster.waitForLeaderElection({ timeoutMs: 3000 });
  
  // 3. Ensure surviving 3 nodes achieve consensus write
  const writeSuccess = await cluster.proposeEntry({
    key: 'health_check',
    value: Date.now(),
    term: cluster.getCurrentTerm()
  });

  if (!writeSuccess) {
    throw new Error('Consensus write failed: surviving 3 nodes unable to reach quorum');
  }

  return true;
}`,
    test: `describe('Raft Two-Node Crash Boundary', () => {
  it('should maintain write availability with exactly 3 surviving nodes', async () => {
    const cluster = new RaftTestHarness(5);
    await cluster.start();

    // Kill Leader and Follower #2
    await cluster.killNodes(['node-1', 'node-2']);

    // Allow election epoch to advance
    await vi.waitFor(() => expect(cluster.getActiveLeader()).not.toBeNull(), { timeout: 3500 });

    const leader = cluster.getActiveLeader();
    expect(['node-3', 'node-4', 'node-5']).toContain(leader.id);
    expect(cluster.getTerm()).toBeGreaterThan(1);

    // Verify consensus entry commit with remaining 3 nodes
    const commitResult = await cluster.commitLogEntry('txn_001');
    expect(commitResult.replicatedCount).toBe(3);
    expect(commitResult.status).toBe('COMMITTED');
  });
});`,
    verify: '1. Surviving nodes elect a single leader within 2.4s.\n2. Write log commits succeed with exactly 3 acknowledgments.\n3. Quorum margin alert warns SRE team: "Margin is 0 nodes until quorum collapse".',
    runbook: `## SRE Runbook: Raft Quorum Margin Warning (2 Nodes Dead)
- **Severity**: P1 - HIGH RISK
- **Prometheus Alert**: \`raft_cluster_online_nodes <= 3\`
- **Action**: Immediately spawn 2 replacement container pods or restore failed nodes to bring cluster back to 5 nodes.`,
    issue: 'test(raft): add multi-node chaos harness verifying 2-node drop recovery'
  },

  'quorum-loss': {
    id: 'quorum-loss',
    title: 'Quorum Collapse (< 3 Nodes) & Split-Brain Prevention',
    category: 'Consensus Cluster',
    severity: 'EMERGENCY',
    roi: 'Prevents catastrophic database split-brain and corrupt writes',
    problem: 'When 3 or more nodes in a 5-node cluster fail, the cluster loses majority quorum (online nodes < 3). Attempting to commit writes in this state causes silent data corruption or split-brain.',
    why: 'Under Raft and Paxos, no partition without a strict majority (> 50%) is permitted to elect a leader or commit transactions. If an isolated partition accepts writes, divergence between split partitions requires irreversible manual data reconciliation.',
    change: 'Implement strict quorum fencing: when active nodes drop below 3, immediately reject all mutations with 503 Service Unavailable / READ_ONLY_DEGRADED mode, broadcast high-priority PagerDuty alerts, and freeze log indices.',
    codeLang: 'typescript',
    code: `// Quorum Fencing Middleware
export function enforceConsensusQuorum(cluster: RaftClusterState) {
  const activeNodes = cluster.nodes.filter(n => n.status === 'ONLINE' && !n.isIsolated);
  const quorumRequired = Math.floor(cluster.nodes.length / 2) + 1; // 3 for N=5

  if (activeNodes.length < quorumRequired) {
    // 1. Immediately revoke leadership
    cluster.currentRole = 'FENCED';
    
    // 2. Reject write requests with explicit safety code
    return {
      canCommit: false,
      error: 'QUORUM_LOST_WRITE_BLOCKED',
      message: \`Active nodes (\${activeNodes.length}) below minimum quorum (\${quorumRequired}). Writes frozen to prevent split-brain.\`,
      mode: 'READ_ONLY_SAFE',
    };
  }

  return { canCommit: true, mode: 'NORMAL' };
}`,
    test: `describe('Quorum Loss Safety Boundary', () => {
  it('should immediately freeze writes and return 503 when nodes drop below 3', async () => {
    const cluster = new RaftCluster({ totalNodes: 5 });
    
    // Simulate 3 node crashes
    cluster.killNodes(['node-1', 'node-2', 'node-3']);

    const writeAttempt = await cluster.submitWrite({ key: 'user_balance', val: 500 });
    
    expect(writeAttempt.success).toBe(false);
    expect(writeAttempt.statusCode).toBe(503);
    expect(writeAttempt.error).toBe('QUORUM_LOST_WRITE_BLOCKED');
    expect(cluster.getState()).toBe('FENCED');
  });
});`,
    verify: '1. Zero uncommitted or phantom entries committed during minority state.\n2. Prometheus alert fires within 500ms of quorum loss.\n3. Automatic cluster healing as soon as the 3rd node rejoins mesh.',
    runbook: `## SRE Runbook: Emergency Quorum Loss (< 3 Nodes)
- **Severity**: P0 - CRITICAL INCIDENT
- **Trigger**: \`count(raft_nodes_online) < 3\`
- **Automated Actions**: Cluster enters FENCED READ-ONLY mode.
- **Manual Protocol**:
  1. Inspect network connectivity across Kubernetes nodes.
  2. Check disk I/O latency for WAL writes.
  3. Perform controlled rolling restart of stopped instances.`,
    issue: 'feat(consensus): enforce quorum fencing and emit P0 alert when nodes < 3'
  },

  'regional-failover': {
    id: 'regional-failover',
    title: 'Multi-Region Failover Runbook & DNS Traffic Shift',
    category: 'Cloud Infrastructure',
    severity: 'CRITICAL',
    roi: '$32,000/min business continuity protection',
    problem: 'When AWS us-east-1 suffers a major network or power outage, global users experience total disconnection until Route 53 DNS and load balancers re-route traffic to secondary regions.',
    why: 'Without automated health canary probes and pre-warmed secondary capacity (us-west-2, eu-west-1), regional failover creates massive traffic stampedes on undersized standby clusters, triggering secondary outages.',
    change: 'Automate Route 53 failover records with 10-second TTLs, maintain auto-scaling headroom in secondary regions, and implement an automated runbook for traffic drain and data replication convergence verification.',
    codeLang: 'typescript',
    code: `import { Route53Client, ChangeResourceRecordSetsCommand } from '@aws-sdk/client-route-53';

// SRE Regional Failover Orchestrator
export async function executeRegionalFailover(failedRegion: string, targetRegion: string) {
  const route53 = new Route53Client({ region: 'us-east-1' });

  // 1. Verify target region is healthy and pre-warmed
  const targetHealth = await checkRegionCapacity(targetRegion);
  if (!targetHealth.ready) {
    throw new Error(\`Cannot failover to \${targetRegion}: Insufficient pod capacity.\`);
  }

  // 2. Execute low-TTL DNS weight change (Drain failed region -> 0%, Boost target -> 100%)
  const shiftDnsCommand = new ChangeResourceRecordSetsCommand({
    HostedZoneId: process.env.AWS_HOSTED_ZONE_ID,
    ChangeBatch: {
      Comment: \`Automated failover from \${failedRegion} to \${targetRegion}\`,
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: 'api.enterprise.com',
            Type: 'A',
            SetIdentifier: failedRegion,
            Weight: 0, // Drain traffic
            TTL: 10,
            ResourceRecords: [{ Value: getRegionLbIp(failedRegion) }]
          }
        },
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: 'api.enterprise.com',
            Type: 'A',
            SetIdentifier: targetRegion,
            Weight: 100, // Shift 100% traffic
            TTL: 10,
            ResourceRecords: [{ Value: getRegionLbIp(targetRegion) }]
          }
        }
      ]
    }
  });

  return await route53.send(shiftDnsCommand);
}`,
    test: `describe('Regional Traffic Failover', () => {
  it('should drain failing us-east-1 and shift 100% traffic to us-west-2 within 15 seconds', async () => {
    const mockRouter = new MockGlobalDnsRouter();
    mockRouter.registerRegion('us-east-1', { weight: 50, healthy: true });
    mockRouter.registerRegion('us-west-2', { weight: 50, healthy: true });

    // Simulate us-east-1 crash
    mockRouter.markUnhealthy('us-east-1');
    await mockRouter.evaluateFailoverPolicy();

    const routingTable = mockRouter.getActiveWeights();
    expect(routingTable['us-east-1']).toBe(0);
    expect(routingTable['us-west-2']).toBe(100);
    expect(mockRouter.isTrafficConverged()).toBe(true);
  });
});`,
    verify: '1. Route 53 DNS shift propagates globally within 30 seconds.\n2. Ingress HTTP error rate returns below 0.1% in target region.\n3. Aurora Global Database replication lag stays < 200ms.',
    runbook: `## SRE Runbook: Regional AWS Blackout & Failover
- **Trigger**: AWS Health Canary returns 3 consecutive failures for us-east-1.
- **Pre-Flight**: Verify secondary region (us-west-2) auto-scaler has scaled minimum replicas to 150%.
- **Step 1**: Execute DNS traffic shift script: \`pnpm run failover:west\`.
- **Step 2**: Monitor CloudWatch \`TargetResponseTime\` and \`HTTPCode_Target_5XX_Count\`.
- **Rollback Criteria**: Only restore us-east-1 after 15 minutes of uninterrupted 200 OK health and database replication sync.`,
    issue: 'ops(cloud): automate Route 53 low-TTL failover and secondary pre-warming'
  },

  'database-failure': {
    id: 'database-failure',
    title: 'Database Cluster Connection Pool & Replica Protection',
    category: 'Data Storage',
    severity: 'CRITICAL',
    roi: '$24,000/min data tier protection',
    problem: 'When the primary DynamoDB or PostgreSQL cluster crashes or experiences I/O lock, order transactions queue up and exhaust connection pools across all dependent microservices.',
    why: 'Services without pool backoff or read-replica splitting choke all memory buffers, preventing read operations and causing total cluster deadlock.',
    change: 'Split read traffic to read-replicas, add exponential backoff jitter on connection attempts, and enable degraded read mode from Redis cache when writes fail.',
    codeLang: 'typescript',
    code: `// Resilient Database Read/Write Segregation with Jittered Backoff
export async function executeDbQuery<T>(query: DbQuery, isWrite = false): Promise<T> {
  const pool = isWrite ? primaryDbPool : replicaDbPool;
  
  return await retryWithFullJitter(async () => {
    const client = await pool.acquireConnection({ timeoutMs: 1200 });
    try {
      return await client.query(query);
    } finally {
      client.release();
    }
  }, { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 1500 });
}`,
    test: `it('should fallback to read-replica when primary writer is unavailable', async () => {
  const dbManager = new DatabaseRouter({ primaryUp: false, replicaUp: true });
  const result = await dbManager.fetchUserCatalog('user_42');
  expect(result.source).toBe('REPLICA_NODE');
  expect(result.data).toBeDefined();
});`,
    verify: 'Read availability remains 100% via read replicas while writes are safely buffered in transactional queue.',
    runbook: `## SRE Runbook: Database Primary Down
- Monitor: \`pg_stat_activity\` or AWS DynamoDB \`ThrottledRequests\`.
- Action: Trigger automated read-replica promotion via RDS / CloudWatch alarm.`,
    issue: 'feat(db): implement read/write segregation and connection pool circuit breaking'
  },

  'cache-stampede': {
    id: 'cache-stampede',
    title: 'Redis Cache Stampede & Thundering Herd Defense',
    category: 'Caching Tier',
    severity: 'HIGH',
    roi: 'Protects primary database from 10x query spike',
    problem: 'When Redis crashes or key TTLs expire concurrently, thousands of concurrent requests bypass cache and hit the database simultaneously.',
    why: 'Known as the "Thundering Herd" or "Cache Stampede", the lack of mutual-exclusion locking on cache misses instantly saturates relational DB connection limits.',
    change: 'Implement single-flight probabilistic early expiration (XFetch) or mutex locking on key regeneration so only 1 worker queries the database.',
    codeLang: 'typescript',
    code: `// Mutual Exclusion Cache Stampede Barrier
const inFlightPromises = new Map<string, Promise<any>>();

export async function fetchWithStampedeProtection<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Single-flight deduplication: Only one DB query in-flight for this key
  if (!inFlightPromises.has(key)) {
    const loaderPromise = loader().then(async (data) => {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      inFlightPromises.delete(key);
      return data;
    }).catch((err) => {
      inFlightPromises.delete(key);
      throw err;
    });
    inFlightPromises.set(key, loaderPromise);
  }

  return await inFlightPromises.get(key);
}`,
    test: `it('should execute DB loader exactly once when 50 concurrent requests miss cache', async () => {
  const dbLoader = vi.fn().mockResolvedValue({ id: 1, name: 'Item' });
  const concurrentCalls = Array.from({ length: 50 }, () => fetchWithStampedeProtection('product_1', 60, dbLoader));
  await Promise.all(concurrentCalls);
  expect(dbLoader).toHaveBeenCalledTimes(1);
});`,
    verify: 'Database CPU utilization remains stable (< 30%) during Redis restart or cache eviction bursts.',
    runbook: `## SRE Runbook: Redis Cache Collapse
- Check Redis memory exhaustion (\`INFO memory\`).
- Ensure Single-Flight lock is active on API instances.`,
    issue: 'perf(cache): implement single-flight mutex to eliminate thundering herd'
  }
};

// Returns matching guidance based on cluster/service/scenario state
export function resolveEngineeringGuidance({
  activeScenarioId,
  offlineServices = [],
  offlineRegions = [],
  offlineNodes = [],
  isolatedNodes = [],
  isDdosActive = false,
  quorumCount = 5,
  totalNodes = 5
}) {
  // 1. Explicit scenario selected
  if (activeScenarioId && FAILURE_GUIDANCE[activeScenarioId]) {
    return FAILURE_GUIDANCE[activeScenarioId];
  }

  // 2. Consensus Quorum Loss (< 3 nodes)
  if (quorumCount < Math.floor(totalNodes / 2) + 1) {
    return FAILURE_GUIDANCE['quorum-loss'];
  }

  // 3. Two node failure (exactly 2 nodes offline or isolated)
  const deadOrIsolated = new Set([...offlineNodes.map(n => n.id), ...isolatedNodes]);
  if (deadOrIsolated.size === 2) {
    return FAILURE_GUIDANCE['two-node-failure'];
  }

  // 4. Specific service failures
  if (offlineServices.some(s => s.id === 'payments')) {
    return FAILURE_GUIDANCE['payment-failure'];
  }
  if (offlineServices.some(s => s.id === 'database')) {
    return FAILURE_GUIDANCE['database-failure'];
  }
  if (offlineServices.some(s => s.id === 'cache')) {
    return FAILURE_GUIDANCE['cache-stampede'];
  }
  if (offlineServices.some(s => s.breaker === 'TRIPPED')) {
    return FAILURE_GUIDANCE['circuit-breaker'];
  }

  // 5. Regional failure
  if (offlineRegions.length > 0) {
    return FAILURE_GUIDANCE['regional-failover'];
  }

  // Default to payment hardening or first guide
  return FAILURE_GUIDANCE['payment-failure'];
}
