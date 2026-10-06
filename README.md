# ChaosWhisper ⚡
### Voice-Controlled Incident Rehearsal Simulator for Distributed Systems

> **Built hands-free using Wispr Flow** for the Wispr Flow Shortlisting Task.

![Architecture](https://img.shields.io/badge/Architecture-Microservices_|_Multi--Region_|_Raft-emerald?style=for-the-badge)
![Voice Tool](https://img.shields.io/badge/Voice_Tool-Wispr_Flow-cyan?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React_|_Web_Audio_|_SVG_Mesh_|_Tailwind-blue?style=for-the-badge)

---

## 📖 Overview
**ChaosWhisper** is a browser-based SRE training lab. Speak or type a failure scenario, watch a distributed-systems simulation respond, inspect the blast radius, and export a rehearsal report.

It is deliberately safe: the cockpit does not connect to or modify cloud infrastructure. Its purpose is to make incident response mechanics tangible before a team has to face them in production.

---

## 🌟 What Makes This Useful

### 1. 🔀 Multi-Topology Architecture Engine (3 Cockpits in 1)
Switch between 3 teaching perspectives instantly:
* **Microservice dependency mesh (7 services):** Gateway, auth, orders, payments, data, cache, and events.
* **Multi-region traffic map (5 regions):** Simulated failover and latency changes across a global footprint.
* **Raft-inspired consensus cluster (5 nodes):** Leader failure, elections, partitions, quorum loss, and recovery.

### 2. ⚡ Failure Propagation You Can See
The simulation models common resilience patterns:
* When a mission-critical dependency (like the Payment Gateway or DynamoDB) crashes, upstream services automatically trip their circuit breakers to **OPEN / TRIPPED**.
* Protects the cluster from catastrophic cascading collapse and serves graceful cached fallbacks.

### 3. 💰 Scenario-Based Business Impact
The loss counter is an illustrative scenario estimate, not a production finance system:
* **Revenue at Risk Rate ($/min):** Shows how different simulated failures change business exposure.
* **Downtime Burn Accumulator:** Makes the cost of recovery delay visible during a drill.

### 4. 📋 Rehearsal Report Export
* Click **"Incident Report"** or say *"Export Report"*: ChaosWhisper compiles a **GitHub-Flavored Markdown rehearsal report** with the simulated timeline, quorum state, MTTR measurements, and follow-up ideas. It is evidence from the drill, not a compliance certification.

### 5. 🌐 Read-Only HTTP Resilience Probe
* Input an HTTP/REST health endpoint and send a small GET burst to measure browser-observed latency, timeouts, and status codes. It does not mutate or attack the target service.

### 6. 🎯 Readiness Board
* Run repeatable checkout, leader-failover, and regional-failover rehearsals with explicit objectives.
* Complete a drill only after restoring the simulation, then carry the evidence into the exported report.
* This turns a flashy incident demo into a repeatable practice loop for onboarding, game days, and reliability reviews.

### 7. 🧰 SRE Remediation Studio (The Missing Engineering Bridge)
Every failure triggers concrete engineering guidance instead of mere animation:

1. **Problem Statement:** Exact customer-impacting behavior exposed by the failure.
2. **Root Cause Analysis:** Thread starvation, retry amplification, quorum loss, or split-brain risk.
3. **Production Code Patch:** Real copy-pasteable TypeScript/Node code (e.g. 800ms bounded timeout, circuit breaker fallback, Route 53 DNS shift, single-flight cache lock).
4. **Automated Vitest/Jest Failure Test:** Test suite to add into CI/CD reproducing the fault condition.
5. **Verification & Proof Signals:** Prometheus/Datadog metric alerts (e.g. Quorum < 3 alert, P99 < 900ms threshold) and an interactive **"Simulate Fix & Verify"** button to validate cluster resilience in real time.

---

## 🎙️ Spoken Chaos & Incident Rehearsal Commands

| Spoken Voice Command | Simulation Reaction | What to Show |
| :--- | :--- | :--- |
| *"Kill Payment Gateway"* / *"Payment drill"* | Drops simulated payment service | 800ms bounded timeout & fallback guidance |
| *"Trip Circuit Breaker"* / *"Breaker drill"* | Opens simulated breakers | Fast-fail test suite & synthetic fallback |
| *"Two node drill"* | Kills 2 out of 5 Raft nodes | Quorum margin boundary & surviving majority vote |
| *"Quorum drill"* / *"Quorum alert"* | Simulates 3-node loss (<3 quorum) | Split-brain prevention, write freeze, P0 alert |
| *"Blackout US East"* / *"Region drill"* | Takes `us-east-1` offline | Route 53 low-TTL DNS failover runbook |
| *"Black Friday Drill"* | Injects 150k RPS flood | Redis cache stampede single-flight lock |
| *"Verify fix"* / *"Simulate fix"* | Injects virtual resilience patch | 100% recovery verification and SLO certification |
| *"Status report"* | Reads current simulation state | Resiliency score and degraded dependencies |
| *"What is our blast radius?"* | Calculates degradation % | Impact assessment and risk rate |
| *"What is our financial loss?"* | Reads illustrative scenario exposure | Downtime cost accumulator |
| *"Heal cluster"* / *"Restore all"* | Restores modeled components | Recovery and clean operational state |

## ✅ Wispr Flow Submission Checklist

This project is designed for the Wispr Flow Shortlisting Task. Before submitting, verify each item yourself:

- Create or confirm your Wispr Flow account using the required referral link: [ref.wisprflow.ai/hhg](https://ref.wisprflow.ai/hhg).
- Record the actual development process with Wispr Flow and your voice visible in the video. A final-app walkthrough alone is not enough.
- Show at least one voice-driven code change, the running app, and a voice command controlling the simulation.
- Submit this GitHub repository: [github.com/soumyalimje/ChaosWhisper](https://github.com/soumyalimje/ChaosWhisper).
- Submit the demo video and repository through the official [submission form](https://forms.gle/Lv9wF8gYVHdEqfJW8).
- Do not submit until the video, repository, and referral-account requirement are all confirmed; the task allows no resubmissions.

---

## 🛠️ Tech Stack
* **Frontend:** React 18, Tailwind CSS, Lucide Enterprise Icons
* **Simulation Engine:** Raft-inspired consensus state machine, multi-topology dependency graph, circuit breaker state controller
* **Audio Synthesis:** Web Audio API (Zero-asset procedural oscillators & sound FX)
* **Voice AI Plane:** Web Speech API & Wispr Flow Speech-to-Intent Parser
* **Build Tool:** Vite

---

## 🚀 Quickstart

```bash
# Clone the repository
git clone https://github.com/soumyalimje/chaos-whisper.git
cd chaos-whisper

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Chrome, Edge, and Brave support the optional Web Speech API; the text command field always works as a fallback.

---

## 🧠 Built for Wispr Flow
This project was conceptualized, designed, and iterated **using Wispr Flow** for hands-free voice-driven software engineering. Wispr Flow is an input method for the demo, not a runtime dependency.
