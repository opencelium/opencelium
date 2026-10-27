# Installing the AI gateway on a new machine

Everything runs locally: no cloud AI, no API keys. Written for macOS on Apple Silicon (16 GB RAM or more; 24 GB recommended).

## 1. Prerequisites

```bash
# Homebrew: https://brew.sh
brew install node@24 git          # the gateway needs Node 24+ (it runs TypeScript directly)
node -v                           # v24.x
```

## 2. Ollama and the models (~13 GB)

```bash
brew install ollama
brew services start ollama        # starts now and at every login, on 127.0.0.1:11434
ollama pull qwen2.5-coder:14b     # workflows and scripts
ollama pull qwen2.5-coder:7b      # command palette
ollama pull nomic-embed-text      # search by meaning, template examples
```

## 3. Voice input (optional, ~550 MB)

Skip this step if you don't need voice commands. The palette then simply shows no microphone.

```bash
brew install whisper.cpp
mkdir -p ~/models/whisper
curl -L -o ~/models/whisper/ggml-large-v3-turbo-q5_0.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
```

Start it at every login with a launchd job:

```bash
cat > ~/Library/LaunchAgents/io.opencelium.whisper-server.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>io.opencelium.whisper-server</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(brew --prefix)/bin/whisper-server</string>
    <string>-m</string><string>$HOME/models/whisper/ggml-large-v3-turbo-q5_0.bin</string>
    <string>--host</string><string>127.0.0.1</string>
    <string>--port</string><string>8178</string>
    <string>-l</string><string>auto</string>
    <string>-nt</string>
    <string>-sns</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/opencelium-whisper-server.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/opencelium-whisper-server.log</string>
</dict>
</plist>
EOF
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/io.opencelium.whisper-server.plist
```

Restart it with `launchctl kickstart -k gui/$(id -u)/io.opencelium.whisper-server`; turn it off with
`launchctl bootout gui/$(id -u)/io.opencelium.whisper-server`.

## 4. The gateway

```bash
cd opencelium/src/ai-gateway
npm install
npm start                         # http://127.0.0.1:8787
```

It reads the invokers from `../backend/runtime/invoker` and the templates from `../backend/runtime/templates`. If the
backend lives elsewhere, or the frontend runs on another origin, set the variables before `npm start`:

```bash
AI_INVOKER_DIR=/path/to/runtime/invoker \
AI_TEMPLATE_DIR=/path/to/runtime/templates \
AI_CORS_ORIGINS=http://localhost:5173 \
npm start
```

All settings (models, ports, timeouts) are listed in `README.md` under "Configuration".

## 5. Check that it works

```bash
curl -s localhost:8787/health
```

You should see `"status":"ok"`, `"available":true` for the workflow model, an `invokerCount` above 0, and
`"speech":{"available":true}` if you set up voice.

Optional: `npm test` (unit tests) and `npm run eval:commands` (routes 27 sample prompts through the real models;
expect 27/27, about 3–4 s per prompt).

## 6. Connect the frontend

The frontend finds the gateway through the `ai` block in `src/frontend/public/config.json` (`dist/config.json` in a
deployed build); the default port `8787` on the page's own host fits the setup above:

```json
"ai": { "protocol": "", "hostname": "", "port": "8787", "prefix": "" }
```

Reload the app: the AI button appears in the workflow editor, and the command palette offers "Ask AI" and the microphone
(press M outside text fields to speak).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| AI button disabled, "AI service isn't reachable" | Is the gateway running (`curl localhost:8787/health`)? Is Ollama running (`brew services list`)? |
| `status: degraded` | A model is missing: `ollama list`, then `ollama pull …` |
| Browser shows CORS errors | Add the frontend's origin to `AI_CORS_ORIGINS` |
| No microphone in the palette | `speech.available` false: check `~/Library/Logs/opencelium-whisper-server.log`. Browsers only allow the microphone on `https` or `localhost` |
| First answer is slow | The model is loading into memory; later answers are faster. Planning a workflow takes 30–60 s; other requests wait behind it |
