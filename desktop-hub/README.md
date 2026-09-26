# Onyx

Every AI coding agent in one app. Onyx is a desktop app for **Claude Code**, **ChatGPT (Codex CLI)** and **OpenCode**: pick an AI and a model, see its thought process and file activity, and keep your chats in one place. It uses each CLI's own sign-in, so no API keys are stored in Onyx.

**Download:** https://unpaused.online/Onyx/ — Windows (.exe), macOS (.dmg) and Linux (.AppImage).

On first launch Onyx detects the CLIs installed on your computer and shows how to install the rest. Any other AI command-line tool can be added as a custom provider in **Settings → Providers**.

## Run from source
Requires Node.js 18+.

```bash
npm install
npm start
```

Or create a desktop shortcut: `install-windows.ps1` on Windows, `./install.sh` on macOS / Linux.

## Build installers
```bash
npm run dist:win     # dist/Onyx-Setup.exe
npm run dist:mac     # dist/Onyx.dmg (must run on macOS)
npm run dist:linux   # dist/Onyx.AppImage
```

`npm run icon` regenerates the icons from `logo.svg`.

## Releasing
Push a version tag and GitHub Actions builds all three installers and publishes them as a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The download page is https://unpaused.online/Onyx/ (hosted with the Unpaused site).
