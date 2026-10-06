# ChaosWhisper

### A future-ready reliability lab for productive, profitable engineering

ChaosWhisper turns distributed-systems failure practice into a repeatable engineering advantage. Trigger controlled failures in a microservice mesh, AWS-style multi-region topology, or five-node Raft-inspired cluster; watch the modeled blast radius change; apply remediation guidance; and export evidence from the rehearsal.

It helps teams spend less time guessing during incidents and more time making prepared, measurable decisions. The result is a tighter path from failure signal to fix: practise faster, recover with more confidence, reduce avoidable downtime risk, and build reliability knowledge that compounds across the team.

The simulation is intentionally non-production. It does not connect to, mutate, or deploy changes to cloud infrastructure. Business-impact numbers are illustrative estimates, not financial reporting.

## Why It Matters to Engineers

ChaosWhisper gives engineers a repeatable place to practise the work that is hardest to simulate during a calm day:

- **Build incident fluency:** Rehearse failure detection, blast-radius assessment, communication, and recovery without waiting for a real outage.
- **Test resilience decisions:** See how timeouts, circuit breakers, cache failures, regional failover, leader elections, partitions, and quorum loss affect dependent systems.
- **Make recovery measurable:** Compare resiliency score, latency, quorum, downtime loss, and MTTR across repeated drills instead of relying on intuition.
- **Connect symptoms to fixes:** Move from a visible failure to a concrete code change, failure test, monitoring signal, and runbook in Remediation Studio.
- **Create shared evidence:** Export a report that supports game days, onboarding, architecture reviews, and post-incident follow-up.

The goal is not to reward engineers for clicking through a demo. It is to help teams practise safe decisions, expose gaps in resilience assumptions, and leave each rehearsal with an actionable next step.

## Productive, Profitable, Future-Ready

- **Productive:** Standardized drills give engineers a shared operating language, shorten onboarding, and turn incident practice into a repeatable workflow rather than a one-off presentation.
- **Profitable:** Earlier detection of weak timeouts, cascading failures, cache stampedes, quorum risks, and regional failover gaps can reduce the duration and cost of real incidents. The simulator's loss ticker makes that business exposure visible; its dollar values are illustrative planning signals, not financial forecasts.
- **Future-ready:** The same cockpit connects human decision-making, voice interaction, automated verification, observability signals, and remediation artifacts. It prepares teams for increasingly distributed systems without requiring access to production infrastructure.

For engineering leaders, this creates a practical reliability loop: **rehearse the risk, measure the response, apply the fix, and carry the evidence into the next review.**

## What Is Included

### Incident Cockpit

The default cockpit combines the following workflows:

- **Readiness Board:** Six repeatable drills with objectives and completion tracking. A drill is certified after the simulated failure is restored.
- **Live topology canvas:** Switch between three views: Microservices Mesh (7), AWS Global Cloud (5), and Raft Consensus (5).
- **Metrics:** Resiliency score, Raft term and quorum, leader status, latency, average MTTR, DDoS state, and event history.
- **Chaos controls:** Crash services, black out regions, isolate or crash Raft nodes, inject latency, trip breakers, run traffic floods, and force elections.
- **Recovery:** `Heal All` restores all modeled services, regions, nodes, partitions, breakers, latency, and synthetic traffic state.

### Remediation Studio

Failure state automatically selects engineering guidance with:

1. Problem statement and customer impact
2. Root-cause analysis
3. Production code example
4. Automated failure-test example
5. Verification signals and an SRE runbook

Plans can be copied or downloaded as Markdown. **Simulate Fix & Verify** applies a virtual resilience patch and restores the simulated environment; it does not change production code or infrastructure.

### Read-Only HTTP Probe

The HTTP Probe sends one or three browser `GET` requests to a URL, with a four-second timeout per request. It records status codes, browser-observed latency, failures, average latency, and pass rate.

The probe is the only feature that contacts an external endpoint. The target must permit browser CORS requests; otherwise the result is reported as a CORS/network error. It sends no `POST`, `PUT`, `PATCH`, or `DELETE` requests and is not a load-testing or attack tool.

### Incident Report

Use **Incident Report** to generate a Markdown rehearsal report containing the event timeline, Raft state, MTTR history, resiliency score, completed readiness drills, and remediation follow-up. The report is evidence from the simulation, not a compliance certification.

## Modeled Systems

### Microservices Mesh

The seven initial services and their IDs are:

| ID | Service | Illustrative loss rate |
| :--- | :--- | ---: |
| `gateway` | Edge API Gateway | `$32,000/min` |
| `auth` | Auth & IAM Service | `$14,000/min` |
| `orders` | Order Engine | No direct loss rate |
| `payments` | Payment Gateway | `$18,500/min` |
| `database` | DynamoDB Cluster | `$24,000/min` |
| `cache` | Redis Cache Layer | `$7,500/min` |
| `kafka` | Kafka Event Bus | `$9,000/min` |

The live risk ticker sums the configured service rates, `$12,500/min` for each offline region, and `$6,000/min` for each offline Raft node. The total outage-loss counter accumulates the current rate once per second during a drill.

### Global Cloud

The five modeled regions are `us-east-1`, `us-west-2`, `eu-west-1`, `ap-south-1`, and `ap-northeast-1`. The regional failover rehearsal takes `us-east-1` offline and provides a Route 53 low-TTL traffic-shift runbook.

### Raft-Inspired Cluster

The cluster contains five nodes, one leader, terms, heartbeats, elections, network isolation, synthetic DDoS traffic, and quorum tracking. Two offline nodes leave three survivors at the quorum boundary; three offline nodes lose quorum and trigger the collapse scenario.

## Readiness Drills

| Drill | Failure modeled | Recovery objective |
| :--- | :--- | :--- |
| Payment Timeout | Payment Gateway failure | Bounded 800ms timeout and order fallback |
| Circuit Breaker Fallback | Dependency saturation | Open breakers and verify synthetic fallback |
| Two-Node Consensus | Two Raft nodes offline | Safely elect Term N+1 with three survivors |
| Quorum Collapse | Three Raft nodes offline | Fence writes and prevent split brain |
| Regional Failover | `us-east-1` blackout | Shift traffic toward `us-west-2` |
| Black Friday 150k RPS | Traffic storm and cache stampede | Exercise cache, database, and recovery behavior |

## Voice and Text Commands

Voice input is optional. Use the command field when speech recognition is unavailable. Examples include:

| Command | Result |
| :--- | :--- |
| `Kill Payment Gateway` or `Payment drill` | Take `payments` offline |
| `Kill Redis` or `Kill Kafka` | Take `cache` or `kafka` offline |
| `Trip Circuit Breaker` | Trip Orders and Payments breakers |
| `Crash Leader` or `Leader drill` | Fail the current Raft leader and start election behavior |
| `Two node drill` | Take two Raft nodes offline |
| `Quorum drill` | Trigger sequential three-node failure |
| `Blackout US East` or `Region drill` | Take `us-east-1` offline |
| `Black Friday Drill` | Start the 150k RPS traffic drill |
| `Inject latency` or `DDoS` | Add synthetic latency or traffic pressure |
| `Status report` | Speak the current score and degraded state |
| `What is our financial loss?` | Speak current rate and accumulated loss |
| `Verify fix` or `Simulate fix` | Apply the virtual patch and verify recovery |
| `Heal cluster` or `Restore all` | Restore the modeled environment |

Voice speed can be changed with `Speed 1`, `Speed 1.5`, or `Speed 2.5`. Topology can be changed with `Microservices`, `AWS`, or `Raft`.

## Run Locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/soumyalimje/ChaosWhisper.git
cd ChaosWhisper
npm install
npm run dev
```

Open `http://localhost:3000`. Available scripts:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Serve the production build locally
```

Chrome, Edge, and Brave provide the best support for the optional Web Speech API. Browser audio and speech permissions may be required. Wispr Flow was used during development but is not a runtime dependency.

## Technology

- React 18 and Vite
- Tailwind CSS utilities and Lucide icons
- Web Speech API for optional recognition and browser speech synthesis for responses
- Web Audio API for procedural alert, click, and recovery sounds
- React state-based simulation with SVG topology visualization
