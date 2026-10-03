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

---

## 🎙️ Spoken Chaos & SRE Voice Commands

| Spoken Voice Command | Cluster Reaction | Enterprise SRE Transition |
| :--- | :--- | :--- |
| *"Kill Payment Gateway"* | Drops Stripe/PayPal service | Upstream Order Engine trips Circuit Breaker |
| *"Blackout US East"* / *"Kill Virginia"* | Severs AWS `us-east-1` region | Route 53 fails over to Oregon; Latency spikes to 168ms |
| *"Trip Circuit Breaker"* | Manually trips breakers | Fallback graceful responses activated |
| *"Black Friday Drill"* | Injects 150,000 RPS peak load | Triggers cache stampede, payment stress, and auto-scaling recovery |
| *"Status report"* | Spoken status update | AI speaks online services, leader, and health |
| *"What is our blast radius?"* | Blast radius assessment | AI announces system degradation & safety buffer |
| *"What is our financial loss?"* | Cost impact analysis | AI speaks current $/min downtime burn rate |
| *"Speed 1.5"* / *"Speed 2.5"* / *"Speed 1"* | Voice tempo calibration | Calibrates voice speed between 1x, 1.5x, and 2.5x Turbo |
| *"Heal cluster"* / *"Restore all"* | Universal multi-tier restore | Reconnects all microservices, cloud regions, and nodes |

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
