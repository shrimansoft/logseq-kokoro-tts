# Logseq DB-version TTS Plugin — Implementation Plan

> **Status**: MVP implemented and build-verified. Manual Logseq smoke test remains.
> **Target**: Logseq DB version (not the old Markdown-file-first version)
> **Backend**: Local Kokoro-FastAPI at `http://localhost:8880`

---

## 0. Key Assumption

This plugin targets the **new Logseq DB version**, not the old Markdown-file-first version.

| | Old Logseq | New Logseq DB |
|---|---|---|
| Canonical source | Markdown files | Database graph |
| Block/Page model | Separate concepts | Unified as **nodes** |
| Plugin data access | File paths | Logseq plugin APIs |

**Rule**: Use Logseq APIs only. Do not read or mutate Markdown files directly.

---

## 1. Goal

Build a Logseq plugin that reads the current block/node and plays it via local Kokoro TTS.

```
[ Logseq DB Node / Block ]
        ↓  get text
[ Logseq Plugin (TS) ]
        ↓  POST /v1/audio/speech
[ Kokoro-FastAPI :8880 ]
        ↓  audio blob
[ Browser Audio Player ]
        ↓
      🔊 Speak
```

---

## 2. Core Architecture

```
┌──────────────────────────────┐
│ Logseq DB Version             │
│ Page / Block / Node           │
└──────────────┬───────────────┘
               │ get current block/node text
               v
┌──────────────────────────────┐
│ Logseq Kokoro TTS Plugin      │
│ TypeScript + Logseq Plugin API│
└──────────────┬───────────────┘
               │ POST request
               v
┌──────────────────────────────┐
│ Kokoro-FastAPI                │
│ localhost:8880                │
└──────────────┬───────────────┘
               │ audio response
               v
┌──────────────────────────────┐
│ Audio Playback Layer          │
│ new Audio(blobUrl).play()     │
└──────────────────────────────┘
```

---

## 3. MVP Scope

### Must build first

| # | Feature |
|---|---|
| 1 | Speak current block/node |
| 2 | Slash command: `/tts` |
| 3 | Command palette: "Kokoro TTS: Speak current block" |
| 4 | Stop audio command |
| 5 | Plugin settings (server URL, voice, speed, format) |
| 6 | Clean Logseq syntax before TTS |
| 7 | Loading/error messages |

### Do not build in MVP

- [ ] Whole page reading
- [ ] Audio caching
- [ ] Save audio to assets
- [ ] Queue reader
- [ ] Per-node custom voice
- [ ] Highlight currently spoken text

---

## 4. Folder Structure

```
logseq-kokoro-tts/
│
├─ package.json
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ PLAN.md
│
└─ src/
   ├─ main.ts          # Plugin init, command registration, wiring
   ├─ settings.ts      # Default settings, read/write
   ├─ tts.ts           # Kokoro API client
   ├─ audio.ts         # Audio playback, stop, replay
   ├─ text.ts          # Logseq syntax cleanup
   ├─ logseq-db.ts     # Get current block/node via Logseq APIs
   └─ types.ts         # Shared TypeScript interfaces
```

---

## 5. Module Responsibilities

### main.ts
- Initialize plugin
- Register settings
- Register slash command `/tts`
- Register command palette actions
- Wire UI actions to TTS service

### settings.ts
- Define default settings
- Read/write settings safely with fallbacks

**Defaults**:
```json
{
  "serverUrl": "http://localhost:8880",
  "voice": "af_bella",
  "speed": 1.0,
  "responseFormat": "wav",
  "cleanText": true,
  "showStatus": true
}
```

### logseq-db.ts
- Get current block/node via `logseq.editor.getCurrentBlock()`
- Avoid direct file access
- Use Logseq DB APIs only

### text.ts
- Clean Logseq syntax before sending to TTS
- Remove page-link brackets `[[...]]`
- Remove markdown markers (`**`, `__`, `-`, `*`)
- Remove tags `#tag`
- Remove DB properties `key:: value`

### tts.ts
- Build Kokoro request body
- Call `POST /v1/audio/speech`
- Return audio `Blob`
- Handle server/API errors

### audio.ts
- Play audio blob via `new Audio(blobUrl)`
- Stop current audio
- Replay last audio
- Revoke old blob URLs

---

## 6. Runtime Flow

```
User runs /tts
      ↓
main.ts receives command
      ↓
logseq-db.ts gets current block/node
      ↓
text.ts cleans text
      ↓
tts.ts sends request to Kokoro
      ↓
Kokoro returns mp3/wav blob
      ↓
audio.ts plays blob
      ↓
UI shows success/failure
```

---

## 7. Kokoro API Contract

**Endpoint**: `POST {serverUrl}/v1/audio/speech`

**Request body**:
```json
{
  "model": "kokoro",
  "input": "text to speak",
  "voice": "af_bella",
  "response_format": "wav",
  "speed": 1.0
}
```

**Response**: Binary audio blob (mp3/wav/opus/flac)

**Error handling**: Non-200 responses throw with status code and message.

---

## 8. Error Handling Matrix

| Problem | Plugin behavior |
|---|---|
| Kokoro server offline | "Kokoro server not reachable. Start localhost:8880." |
| No selected block | "No block selected." |
| Empty text after cleaning | "No readable text found." |
| Long text | MVP: truncate politely |
| API returns non-200 | Show status code and short message |
| Audio play blocked | "Click inside Logseq and try again." |
| CORS issue | "Kokoro server blocked the browser request. Enable CORS." |

---

## 9. UX Design

### Commands

| Trigger | Action |
|---|---|
| `/tts` | Speak current block |
| Command palette: "Kokoro TTS: Speak current block" | Speak current block |
| Command palette: "Kokoro TTS: Stop audio" | Stop playback |
| Command palette: "Kokoro TTS: Replay last audio" | Replay |
| Command palette: "Kokoro TTS: Open settings" | Settings modal |

### Status messages

- "Generating speech..."
- "Playing."
- "Stopped."
- "Kokoro server not reachable."
- "No readable text found."

### Settings screen

```
┌────────────────────────────────────┐
│ Kokoro Server URL                  │
│ http://localhost:8880              │
├────────────────────────────────────┤
│ Voice                              │
│ af_bella                           │
├────────────────────────────────────┤
│ Speed                              │
│ 1.0                                │
├────────────────────────────────────┤
│ Format                             │
│ mp3                                │
├────────────────────────────────────┤
│ Clean Logseq syntax                │
│ true                               │
└────────────────────────────────────┘
```

---

## 10. Development Milestones

| Phase | Goal | Tasks |
|---|---|---|
| 1 | Server test | Run Kokoro-FastAPI, test `/v1/audio/speech`, confirm mp3 |
| 2 | Plugin skeleton | Create Vite+TS plugin, add Logseq libs, show "loaded" |
| 3 | Current block TTS | Get block, clean text, send to Kokoro, play audio |
| 4 | Settings | Add server URL, voice, speed, format settings |
| 5 | Playback controls | Stop, replay, prevent overlap, revoke URLs |
| 6 | DB-version hardening | Avoid file paths, test in block/journal/zoomed node |

---

## 11. Testing Checklist

### Server tests
- [ ] Kokoro server starts
- [ ] `/docs` opens
- [ ] `/v1/audio/speech` returns mp3
- [ ] Invalid voice gives clear error
- [ ] Server offline gives clear error

### Logseq plugin tests
- [ ] Plugin loads
- [ ] `/tts` appears in slash menu
- [ ] Command palette command appears
- [ ] Current block speaks
- [ ] Empty block shows error
- [ ] Long block handles safely
- [ ] Stop command works
- [ ] Replay command works
- [ ] Settings update request body

### DB version tests
- [ ] Works in normal block
- [ ] Works in journal block
- [ ] Works in page-like node
- [ ] Does not read markdown files
- [ ] Does not write markdown files
- [ ] Does not assume file paths

---

## 12. Acceptance Criteria

The project is complete when:

- [ ] User can run Kokoro-FastAPI locally
- [ ] User can install plugin in Logseq DB version
- [ ] User can type `/tts` on a block
- [ ] Plugin reads current block/node text
- [ ] Plugin calls Kokoro endpoint
- [ ] Plugin plays returned audio
- [ ] User can stop audio
- [ ] User can change server URL, voice, speed, format
- [ ] Plugin does not directly edit graph files

---

## 13. Build Order for Agent

1. Create plugin skeleton (package.json, index.html, vite.config.ts, tsconfig.json)
2. Add `src/types.ts` with shared interfaces
3. Add `src/settings.ts` with defaults and read/write
4. Add `src/text.ts` with Logseq syntax cleaner
5. Add `src/tts.ts` with Kokoro API client
6. Add `src/audio.ts` with playback/stop/replay
7. Add `src/logseq-db.ts` with block retrieval
8. Add `src/main.ts` with init, commands, wiring
9. Test with current block in Logseq DB
10. Add stop/replay controls
11. Harden error handling
12. Write README

---

## 14. Base Skeleton (Already Created)

The following files have been pre-created as the starting point:

| File | Purpose |
|---|---|
| `package.json` | Vite + TS build config, Logseq plugin manifest |
| `index.html` | Entry HTML |
| `vite.config.ts` | Vite dev/build config |
| `tsconfig.json` | TypeScript compiler config |
| `src/types.ts` | `TtsSettings`, `GenerateSpeechOptions`, `LogseqBlock` interfaces |
| `src/settings.ts` | `DEFAULT_SETTINGS`, `getSettings()`, `saveSettings()` |
| `src/text.ts` | `cleanLogseqText()`, `truncateText()` |
| `src/tts.ts` | `generateSpeech()`, `formatTtsError()` |
| `src/audio.ts` | `playAudioBlob()`, `stopAudio()`, `replayLastAudio()`, `releaseAudio()` |
| `src/logseq-db.ts` | `getCurrentBlock()`, `getBlockByUuid()` |
| `src/main.ts` | `init()`, command registration, settings UI |

---

## 15. DB-version Notes

For DB version compatibility:

- Think in terms of **nodes** (unified page/block concept)
- Blocks and pages behave more similarly than in old Logseq
- Do not depend on markdown file paths
- Do not parse graph files directly
- Use current block/node APIs
- Keep plugin data in plugin settings/storage

**Reason**: Logseq DB graph treats the database as canonical. The "node" term
covers both pages and blocks because they now behave similarly.

---

## 16. Final Instruction for Coding Agent

**Build a Logseq DB-version compatible TTS plugin.**

**Do:**
- Use Logseq plugin APIs
- Speak current block/node
- Call Kokoro-FastAPI `/v1/audio/speech`
- Play returned audio blob
- Add settings
- Add stop/replay
- Avoid direct markdown file access

**Do not:**
- Modify graph files directly
- Assume Markdown files are canonical
- Build whole-page reading first
- Add caching before MVP works

---

## 17. README Must Include

1. What this plugin does
2. Requirements
3. Kokoro-FastAPI setup
4. Logseq plugin install
5. Plugin settings
6. Commands
7. Troubleshooting
8. DB-version note

> **DB-version note**: "This plugin targets Logseq DB-version behavior. It uses
> Logseq plugin APIs and does not modify Markdown files directly."
