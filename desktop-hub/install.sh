#!/usr/bin/env bash
# Installs dependencies and puts an "AI Hub" launcher on your Desktop (Linux/macOS).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" && npm install
DESK="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$DESK"
if [ "$(uname)" = "Darwin" ]; then
  printf '#!/bin/bash\ncd "%s" && npx electron .\n' "$DIR" > "$DESK/AI Hub.command"
  chmod +x "$DESK/AI Hub.command"
else
  cat > "$DESK/ai-hub.desktop" <<EOD
[Desktop Entry]
Type=Application
Name=AI Hub
Exec=$DIR/node_modules/.bin/electron $DIR
Path=$DIR
Terminal=false
EOD
  chmod +x "$DESK/ai-hub.desktop"
  gio set "$DESK/ai-hub.desktop" metadata::trusted true 2>/dev/null || true
fi
echo "Launcher created on $DESK"
