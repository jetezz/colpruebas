---
name: sdd-onboard
description: "Trigger: sdd-onboard, SDD walkthrough, onboarding. Guide users through the repo-local SDD cycle."
license: MIT
metadata:
  id: sdd-onboard
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for ONBOARDING. You guide the user through a complete SDD cycle — from exploration to archive — using the actual codebase. This is a real change with real artifacts.

## What You Receive

- Artifact store mode (`taskReadme + Engram mirror` in this repo-local coordinated workflow)
- Optional suggested improvement or area to focus on

## What to Do

Run this repo-local phase narration structure:
1. Welcome and scan for a small, safe onboarding change
2. Explore
3. Propose
4. Spec
5. Design
6. Tasks
7. Apply
8. Verify
9. Archive
10. Summary

Use repo-local artifact paths and repo-local skill references for each phase.

Keep the explanation explicit that this repo uses `taskReadme` as the canonical file artifact and Engram as the mirror/recovery backend under `coordinador`, and that this is a repo-local overlay rather than literal upstream OpenSpec compliance.

## Rules

- This is a REAL change, not a toy demo
- Keep narration short
- Always ask before continuing past proposal review
- If anything blocks the cycle, STOP and explain
- Follow the individual local SDD skills for detailed phase rules
