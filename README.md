# Logseq Kokoro TTS

Logseq Kokoro TTS is a Logseq DB-version plugin that speaks selected blocks through a local Kokoro-FastAPI server.

The plugin uses Logseq plugin APIs only. It does not read, write, or parse graph Markdown files directly.

## Requirements

- Logseq DB version
- Node.js 18 or newer
- A local Kokoro-compatible TTS server reachable from Logseq, defaulting to `http://localhost:8880`

## Kokoro-FastAPI Setup

Start Kokoro-FastAPI or an existing Kokoro-compatible TTS server locally and confirm the API is reachable:

```bash
curl http://localhost:8880/docs
```

Then test speech generation:

```bash
curl -X POST http://localhost:8880/v1/audio/speech \
  -H 'Content-Type: application/json' \
  -d '{"model":"kokoro","input":"Hello from Logseq","voice":"af_bella","response_format":"wav","speed":1.0}' \
  --output kokoro-test.wav
```

If you already use a Zotero TTS server and it exposes `/v1/audio/speech`, set `Server URL` to that server's base URL. The plugin accepts the base URL with or without a trailing slash.

If Logseq reports a CORS error, enable browser access in the TTS server configuration.

For the local `zotero-kokoro-server`, CORS is enabled for Logseq origins and the default direct URL is:

```text
http://localhost:8880
```

If you need a fallback for a different server that cannot enable CORS, run:

```bash
npm run proxy
```

Then set `Server URL` to `http://localhost:8881`.

## Development

Install dependencies and build the plugin:

```bash
npm install
npm run build
```

For development builds:

```bash
npm run dev
```

## Logseq Plugin Install

1. Build the plugin with `npm run build`.
2. Open Logseq.
3. Open Settings, then Advanced.
4. Enable developer mode.
5. Open Plugins, then Load unpacked plugin.
6. Select this project directory.

If Logseq has a stale failed import for this plugin id during development, remove the old plugin entry from Logseq's plugin list before loading the unpacked folder again.

## Usage

- Select one or more blocks, right-click a selected block's bullet, then choose `Speak selected block(s)`.
- `Kokoro TTS: Speak selected block(s)`: command palette action for the selected blocks.
- `Kokoro TTS: Stop audio`: stop playback.
- `Kokoro TTS: Replay last audio`: replay the last generated audio.
- `Kokoro TTS: Open settings`: open the plugin settings modal.

## Settings

- `Server URL`: Kokoro-FastAPI base URL. Default: `http://localhost:8880`.
- `Voice`: Kokoro voice name. Default: `af_bella`.
- `Speed`: speech speed. Default: `1.0`.
- `Format`: response audio format, one of `mp3`, `wav`, `opus`, or `flac`. Default: `wav`.
- `Clean Logseq syntax`: remove page links, tags, properties, and common Markdown markers before speech.
- `Show status messages`: show Logseq toast messages during generation and playback.

## Troubleshooting

- `Kokoro server not reachable`: start Kokoro-FastAPI and confirm the server URL setting.
- `No selected blocks with readable text`: select one or more blocks, or right-click a block bullet directly.
- `No readable text found`: the selected blocks are empty or only contain syntax removed by cleaning.
- `Audio play blocked`: click inside Logseq and run the command again.
- API status errors: verify the selected voice, response format, and Kokoro server logs.

## DB-Version Note

This plugin targets Logseq DB-version behavior. It uses Logseq plugin APIs and does not modify Markdown files directly.
