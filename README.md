# ChaosWhisper Enterprise ⚡
### Autonomous Voice-Driven Cloud Resilience & Chaos Engineering Cockpit (Amazon & Netflix Level SRE)

> **Built hands-free using Wispr Flow** for the Wispr Flow Shortlisting Task.

![Architecture](https://img.shields.io/badge/Architecture-Tier--1_Microservices_|_AWS_Multi--Region_|_Raft-emerald?style=for-the-badge)
![Voice Tool](https://img.shields.io/badge/Voice_Tool-Wispr_Flow-cyan?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React_|_Web_Audio_|_SVG_Mesh_|_Tailwind-blue?style=for-the-badge)
![Compliance](https://img.shields.io/badge/Compliance-SOC_2_Type_II_|_ISO_27001-purple?style=for-the-badge)

---

## 📖 Overview
**ChaosWhisper Enterprise** is an autonomous, voice-driven **Site Reliability Engineering (SRE) War Room Cockpit** inspired by Netflix's Chaos Monkey and AWS's mission-critical incident infrastructure.

Rather than frantically typing terminal commands (`kubectl`, `iptables`, SSH) and writing 4-hour post-mortems during high-stakes outages, ChaosWhisper pioneers **VoiceOps (Voice-Driven Cloud Operations)**: speak infrastructure disaster scenarios aloud, watch real-time automated circuit breakers trip, calculate live financial downtime risk, and export executive-ready incident reports hands-free.

---

## 🌟 What Makes This Unique, Productive & Enterprise-Grade

### 1. 🔀 Multi-Topology Architecture Engine (3 Cockpits in 1)
Switch between 3 real-world architectural perspectives instantly:
* **Netflix Microservices Mesh (7 Services):** Edge API Gateway $\to$ Auth & IAM $\to$ Order Engine $\to$ Payment Gateway $\to$ DynamoDB $\to$ Redis Cache $\to$ Kafka Streaming.
* **AWS Global Cloud (5 Regions):** `us-east-1` (N. Virginia), `us-west-2` (Oregon), `eu-west-1` (Frankfurt), `ap-south-1` (Mumbai), `ap-northeast-1` (Tokyo) with cross-continental BGP failover and trans-oceanic routing.
* **Raft Consensus Cluster (5 Nodes):** 5-node distributed state machine with automated term election watchdogs and heartbeat vectors.

### 2. ⚡ Automated Netflix-Style Circuit Breakers
Modeled after **Netflix Hystrix** and **Resilience4j**:
* When a mission-critical dependency (like the Payment Gateway or DynamoDB) crashes, upstream services automatically trip their circuit breakers to **OPEN / TRIPPED**.
* Protects the cluster from catastrophic cascading collapse and serves graceful cached fallbacks.

### 3. 💰 Live Financial Outage Loss & Risk Calculator
Calculates real-time business risk during an outage:
* **Revenue at Risk Rate ($/min):** Evaluates checkout blockages, state write failures, and regional blackouts (e.g. `$18,500/min` when payments are offline).
* **Total Downtime Burn Accumulator:** Live ticker tracking aggregate financial impact.

### 4. 📋 One-Click SRE Incident Post-Mortem & SOC 2 Audit Exporter
* Click **"SRE Report"** or say *"Export Report"*: ChaosWhisper autonomously compiles an audit-ready **Incident Post-Mortem in GitHub-Flavored Markdown** with root cause analysis, millisecond-accurate timeline, MTTR metrics, and hardening recommendations ready for Jira or Confluence.

### 5. 🌐 Real-World Microservice Synthetic Chaos Probe
* Input any live HTTP/REST API or local endpoint (e.g. `http://localhost:8000/health`) and execute synthetic chaos bursts to measure live TTFB latency, timeouts, and status codes.

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
* **Simulation Engine:** Raft Consensus State Machine, Multi-Topology Dependency Graph, Circuit Breaker State Controller
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

Open `http://localhost:3000` in Google Chrome, Edge, or Brave. Click the glowing Voice Orb to activate continuous hands-free voice operations!

---

## 🧠 Built for Wispr Flow
This project was conceptualized, designed, and iterated **using Wispr Flow** for hands-free voice-driven software engineering, establishing an end-to-end benchmark for voice-controlled mission-critical infrastructure.
