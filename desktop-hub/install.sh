#!/usr/bin/env bash
# Installs dependencies and puts an "Onyx" launcher on your Desktop (Linux/macOS).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" && npm install
DESK="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$DESK"
if [ "$(uname)" = "Darwin" ]; then
  printf '#!/bin/bash\ncd "%s" && npx electron .\n' "$DIR" > "$DESK/Onyx.command"
  chmod +x "$DESK/Onyx.command"
else
  cat > "$DESK/onyx.desktop" <<EOD
[Desktop Entry]
Type=Application
Name=Onyx
Icon=$DIR/icon.png
Exec=$DIR/node_modules/.bin/electron $DIR
Path=$DIR
Terminal=false
EOD
  chmod +x "$DESK/onyx.desktop"
  gio set "$DESK/onyx.desktop" metadata::trusted true 2>/dev/null || true
fi
echo "Launcher created on $DESK"
