#!/usr/bin/env bash
# Renders the PWA icons of a project folder with headless Chrome (no other tools needed):
#   icon.svg          -> icon-192.png, icon-512.png            (manifest "any", rounded tile, transparent corners)
#   icon-maskable.svg -> icon-maskable-512.png, apple-touch-icon.png (180 px)  (full-bleed square)
# Usage: tools/pwa-icons.sh <folder> [<folder> ...]     e.g. tools/pwa-icons.sh fish-frenzy .
set -euo pipefail
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

winpath() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }

abspath() { echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; }

render() {  # render <svg> <size> <out.png>
  local svg page
  svg="$(winpath "$(abspath "$1")")"
  page="$TMP/page-$2.html"
  printf '<!doctype html><style>html,body{margin:0;background:transparent}img{display:block;width:%spx;height:%spx}</style><img src="file:///%s">' "$2" "$2" "$svg" > "$page"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --window-size="$2,$2" \
    --screenshot="$(winpath "$(abspath "$3")")" "file:///$(winpath "$page")" >/dev/null 2>&1
  echo "  $3"
}

for dir in "$@"; do
  icon="$dir/icon.svg"; mask="$dir/icon-maskable.svg"
  [ "$dir" = "." ] || [ -f "$icon" ] || { echo "no $icon" >&2; exit 1; }
  [ -f "$icon" ] || icon="assets/icon.svg"
  [ -f "$mask" ] || mask="assets/icon-maskable.svg"
  out="$dir"; [ "$dir" = "." ] && out="assets"
  echo "$dir:"
  render "$icon" 192 "$out/icon-192.png"
  render "$icon" 512 "$out/icon-512.png"
  render "$mask" 512 "$out/icon-maskable-512.png"
  render "$mask" 180 "$out/apple-touch-icon.png"
done
