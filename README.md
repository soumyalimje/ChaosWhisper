# ChaosWhisper ⚡
### Voice-Driven Distributed Systems Chaos Engineering & Resiliency Cockpit

> **Built hands-free using Wispr Flow** for the Wispr Flow Shortlisting Task.

![ChaosWhisper Architecture Banner](https://img.shields.io/badge/Architecture-Raft_Consensus-emerald?style=for-the-badge)
![Voice Driven](https://img.shields.io/badge/Voice_Tool-Wispr_Flow-cyan?style=for-the-badge)
![Engine](https://img.shields.io/badge/Stack-React_|_Web_Audio_|_SVG_Mesh-blue?style=for-the-badge)

---

## 📖 Overview
**ChaosWhisper** is a real-time distributed systems chaos engineering simulator operated completely via voice commands. Inspired by Netflix's Chaos Monkey and modern SRE incident command rooms, it allows engineers to simulate real-time failure scenarios—such as leader crashes, network partitions, split-brain conditions, and latency spikes—across a 5-node cluster running the **Raft consensus algorithm**.

Rather than manually running terminal commands during high-stakes outages, ChaosWhisper pioneers **Voice-Driven Infrastructure Operations (AIOps)**.

---

## 🌟 Key Features

* **5-Node Distributed Raft Cluster:** Visualized topological node mesh with active heartbeats and AppendEntries RPC message vectors.
* **Hands-Free Voice Control Plane:** Native speech-to-intent engine supporting spoken commands for instant chaos injections.
* **Automated Leader Election & Self-Healing:** Watch followers detect missed heartbeats, trigger election timeouts, collect votes, and restore quorum in <900ms.
* **Zero-Asset Procedural Audio:** Synthesized sound effects (alarms, election recovery chords, audio blips) created 100% via the browser's **Web Audio API**.
* **Live Telemetry & Event Stream:** Real-time P99 latency tracking, term numbers, quorum health ratios, and timestamped Raft state transition logs.

---

## 🎙️ Spoken Chaos Commands (Wispr Flow)

| Spoken Voice Command | Cluster Reaction | Raft Transition |
| :--- | :--- | :--- |
| *"Crash leader"* / *"Kill leader"* | Terminates active Primary | Triggers election timeout across followers |
| *"Isolate Node 2"* / *"Partition Node 2"* | Severs connection mesh to Node 2 | Minority partition isolated, quorum holds (4/5) |
| *"Inject latency"* / *"Add jitter"* | Injects 350ms synthetic RPC delay | P99 latency graph spikes, metrics update |
| *"Trigger election"* / *"Force vote"* | Forces re-election cycle | Candidates increment term and broadcast `RequestVote` |
| *"Heal cluster"* / *"Restore all"* | Reconnects all severed lines & nodes | Log synchronization and state reconciliation |

---

## 🛠️ Tech Stack
* **Frontend:** React 18, Tailwind CSS, Lucide Icons
* **Simulation Engine:** Raft Consensus State Machine, Vector Animation Loop
* **Audio Synthesis:** Web Audio API (Procedural Oscillators & Gain Envelopes)
* **Voice Integration:** Wispr Flow Speech Input & Intent Parser
* **Build Tool:** Vite

---

## 🚀 Quickstart

```bash
# Clone the repository
git clone https://github.com/soumyalimje/chaos-whisper.git
cd chaos-whisper

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:3000` in Google Chrome, Edge, or Brave. Click the microphone button to activate voice control, or speak failure scenarios using Wispr Flow!

---

## 🧠 Development Methodology
This project was designed, engineered, and iterated **using Wispr Flow** for voice-driven prompt engineering and code development, establishing an end-to-end benchmark for hands-free software development.
