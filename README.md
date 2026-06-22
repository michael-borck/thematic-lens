# Thematic Lens

Local-first desktop app for **human-in-the-loop thematic analysis**. It's the
curation front-end for the [`thematic-analyser`](https://github.com/michael-borck/thematic-analyser)
engine: the engine runs the multi-LLM consensus, Thematic Lens is where a human
**resolves the disagreements** and shapes the codebook.

A `-lens` product in the [lens family](https://github.com/michael-borck/lens-analysers)
— its own app, sharing the engine, not bolted onto another lens.

## Why a desktop app

Qualitative corpora (interviews, open responses) are sensitive. Everything here
runs **on your machine**: the corpus never leaves it, the engine runs as a local
subprocess, and you can point the consensus panel at **local Ollama** so no text
or API call goes to the cloud at all. API keys are stored locally and passed to
the engine as env — never shown back, never sent to the renderer.

## Architecture

```
Electron (main, Node)                         Renderer (React + Vite + Tailwind)
  index.ts      app bootstrap                   screens/
  database.ts   node:sqlite (no native build)     Projects      runs list
  schema.ts     projects/topics/consensus/themes  NewAnalysis   pick corpus + panel → run
  settings.ts   electron-store; effective-key     Disagreements ★ resolve non-converged topics
  engine.ts     shells out to `thematic-analyser --json`  Codebook   curated labels → REFI-QDA
  export.ts     REFI-QDA codebook (QualCoder/NVivo)        Settings    engine path, panel, keys
  ipc.ts        typed IpcResult dispatch
  preload.ts    contextBridge → window.api
```

The engine is invoked one-shot per run: the resolved API keys + coder panel go in
as env, `--json` comes back as a `ThematicAnalysis`, which is persisted to SQLite.
The **Disagreements** screen reads the rows where the coders did *not* converge
(`agreed = false`) and lets the human pick each final label — the irreducibly
human step. The codebook prefers the human's `resolved_label` over the engine's.

## Prerequisites

The engine must be installed and on PATH (or set its path in Settings):

```bash
pipx install thematic-analyser            # or: uv tool install thematic-analyser
pipx install 'thematic-analyser[topics]'  # if you want to fit topics from raw text
```

## Develop

```bash
npm install
npm run dev          # tsc -w (main) + vite (renderer) + electron
```

`npm run build` compiles both; `npm run dist` packages via electron-builder.

## Status — v0.1 scaffold

Working: run → persist → **resolve disagreements** → codebook → REFI-QDA export;
multi-provider panel + local key storage; engine health check.

Not yet built (clearly seamed):
- **Bundled Python sidecar** — today the engine must be installed separately;
  next milestone bundles a venv like `debrief` does.
- **Codebook hierarchy editor** — drag leaves into parent themes (the `themes`
  table + REFI-QDA export already support the tree; the UI is flat for now).
- Memos, run progress streaming, auto-update.
