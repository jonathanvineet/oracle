# 📚 ORACLE Documentation Index

Welcome to ORACLE! Here's where to find everything.

---

## 🚀 Start Here (First Time?)

**→ [QUICK_START.md](QUICK_START.md)** (10 minutes)
- Get ORACLE working in 10 minutes
- Step-by-step setup for both Android and macOS
- Basic troubleshooting

---

## 📖 Documentation by Purpose

### I Want to Understand What This Is
**→ [README.md](README.md)**
- High-level overview
- Architecture diagram
- Technology stack
- File structure

### I'm Ready to Build It
**→ [EXECUTION_PLAN.md](EXECUTION_PLAN.md)**
- Prioritized task list (Priority 1-5)
- Estimated time for each task
- Exact steps to complete
- **👉 Start here if you want to code**

### I'm Implementing the WebSocket Server
**→ [IMPLEMENTATION.md](IMPLEMENTATION.md)**
- Code examples
- Step-by-step implementation
- Testing procedures
- Debugging guide
- Common issues and solutions

### I Want the Technical Details
**→ [ARCHITECTURE.md](ARCHITECTURE.md)**
- System design deep dive
- Component breakdown
- WebSocket protocol
- Performance characteristics
- Security model
- Data flow examples

### I Need Project Status
**→ [PROJECT_STATUS.md](PROJECT_STATUS.md)**
- One-page project overview
- What's complete vs pending
- Quick reference table
- Technical specifications

### I Need Complete Project Context
**→ [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md)**
- Project history
- Technology choices
- Task completion tracking
- Release plan
- Performance targets

### What Happened in This Session?
**→ [SESSION_SUMMARY.md](SESSION_SUMMARY.md)**
- What was built today
- Architecture decisions
- Current state (80% complete)
- Next immediate steps

---

## 📊 Quick Reference

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| [README.md](README.md) | Project overview | 5 min | Everyone |
| [QUICK_START.md](QUICK_START.md) | Get working | 10 min | First-time users |
| [EXECUTION_PLAN.md](EXECUTION_PLAN.md) | What to do next | 15 min | Developers |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | How to code it | 30 min | Developers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical design | 20 min | Technical leads |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Status at a glance | 5 min | Managers |
| [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) | Full context | 15 min | Project leads |
| [SESSION_SUMMARY.md](SESSION_SUMMARY.md) | What was done | 10 min | Team sync |

---

## 🎯 Choose Your Path

### Path 1: I Want to Understand ORACLE
1. Read: [README.md](README.md) (5 min)
2. Read: [ARCHITECTURE.md](ARCHITECTURE.md) (20 min)
3. Done! You understand it.

### Path 2: I Want to Get It Working (Quick)
1. Read: [QUICK_START.md](QUICK_START.md) (10 min)
2. Follow the setup steps
3. Done! (Note: WebSocket not yet implemented)

### Path 3: I Want to Implement WebSocket (Developer)
1. Read: [EXECUTION_PLAN.md](EXECUTION_PLAN.md) (15 min)
2. Read: [IMPLEMENTATION.md](IMPLEMENTATION.md) (30 min)
3. Do Priority 1 (code the WebSocket server)
4. Follow remaining priorities
5. Done! Full v1.0 ready

### Path 4: I Want to Manage This Project
1. Read: [PROJECT_STATUS.md](PROJECT_STATUS.md) (5 min)
2. Read: [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) (15 min)
3. You have all the status you need

---

## 📱 File Locations

### Core Documents
- **README.md** - Main project documentation
- **QUICK_START.md** - Fast setup guide
- **ARCHITECTURE.md** - Technical specification
- **IMPLEMENTATION.md** - Developer guide
- **EXECUTION_PLAN.md** - Task roadmap
- **PROJECT_STATUS.md** - Status reference
- **DEVELOPMENT_SUMMARY.md** - Complete context
- **SESSION_SUMMARY.md** - Today's work summary

### Source Code
- **mobile/** - Android app (Expo)
  - App.js - Root navigation
  - app.json - Expo configuration
  - screens/LoginScreen.js - Welcome screen
  - screens/StreamScreen.js - Streaming interface

- **mac/** - macOS app (Tauri)
  - src/index.html - Frontend UI
  - src-tauri/src/main.rs - App entry point
  - src-tauri/src/lib.rs - WebSocket client
  - tauri.conf.json - App configuration

### Configuration
- **backend/** - Legacy Next.js (not used)
- **widget/** - Legacy Übersicht widget (not used)
- **packaging/** - Distribution files

---

## ✅ Checklist: Getting Started

- [ ] Read README.md (understand what this is)
- [ ] Read QUICK_START.md (see how to set it up)
- [ ] Read ARCHITECTURE.md (understand how it works)
- [ ] Read EXECUTION_PLAN.md (see what's next)
- [ ] Read IMPLEMENTATION.md (if you're coding)
- [ ] You're ready to go! 🚀

---

## 🔍 Finding Specific Information

### "How do I set up Android?"
→ [QUICK_START.md](QUICK_START.md) → Android Setup section

### "How do I set up macOS?"
→ [QUICK_START.md](QUICK_START.md) → macOS Setup section

### "What's the system architecture?"
→ [ARCHITECTURE.md](ARCHITECTURE.md) → System Architecture section

### "How does WebSocket work?"
→ [ARCHITECTURE.md](ARCHITECTURE.md) → WebSocket Protocol section

### "What do I do next?"
→ [EXECUTION_PLAN.md](EXECUTION_PLAN.md) → PRIORITY 1 section

### "How do I implement WebSocket?"
→ [IMPLEMENTATION.md](IMPLEMENTATION.md) → "Option 1: React Native TCP Socket"

### "What's the current status?"
→ [PROJECT_STATUS.md](PROJECT_STATUS.md) → What's Complete section

### "What was done in this session?"
→ [SESSION_SUMMARY.md](SESSION_SUMMARY.md)

### "I'm stuck, where's the help?"
→ [IMPLEMENTATION.md](IMPLEMENTATION.md) → "Common Issues" section

---

## 🎬 TL;DR

1. **What is ORACLE?** Live camera streaming from Android to macOS via Tailscale
2. **What's done?** Architecture, UI, documentation (~80% complete)
3. **What's missing?** WebSocket server implementation (3 hours of coding)
4. **When will it work?** After WebSocket is implemented (~8 hours total)
5. **What do I do?** Read [EXECUTION_PLAN.md](EXECUTION_PLAN.md) and do Priority 1

---

## 💡 Pro Tips

- **Bookmarks:** Save [EXECUTION_PLAN.md](EXECUTION_PLAN.md) - you'll reference it often
- **Debugging:** [IMPLEMENTATION.md](IMPLEMENTATION.md) has a whole debugging section
- **Architecture Questions:** [ARCHITECTURE.md](ARCHITECTURE.md) has all the "why"
- **Status Updates:** [PROJECT_STATUS.md](PROJECT_STATUS.md) is your quick reference
- **Lost?** Start with [README.md](README.md)

---

## 🚀 Ready to Build?

**Next Step:** Open [EXECUTION_PLAN.md](EXECUTION_PLAN.md) and start with Priority 1

**Time Estimate:** 8 hours active work to v1.0

**Good luck!** 🎬
