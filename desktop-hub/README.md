# AI Hub (desktop)

One window to chat with the AI CLIs installed on your PC: **Claude Code** (`claude`), **Codex** (`codex`) and **OpenCode** (`opencode`). Pick a provider, pick a model, chat. Uses each CLI's own login, so no API keys are stored here.

## Install + desktop shortcut
Requires Node.js 18+ and at least one of the CLIs on your PATH.

- **Windows:** right-click `install-windows.ps1` → *Run with PowerShell*
- **macOS / Linux:** `./install.sh`

Then double-click **AI Hub** on your desktop. Or run `npm start` here.

Edit the `PROVIDERS` model lists in `main.js` to add models.
