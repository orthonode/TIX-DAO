#!/usr/bin/env bash
# TIX-DAO Demo Navigation Script
# Run this AFTER starting your screen recorder (Ctrl+Alt+Shift+R)
# The script handles all Chrome navigation and scrolling.
# You only need to manually: connect wallet + vote when prompted.

BASE="https://tix-dao.vercel.app"
PAUSE=0.05  # scroll smoothness

open_url() {
  google-chrome --new-window "$1" &>/dev/null &
  sleep 3
  # Focus Chrome window
  WID=$(xdotool search --onlyvisible --class "Google-chrome" | tail -1)
  xdotool windowactivate --sync "$WID"
  xdotool windowfocus --sync "$WID"
  # Full screen
  xdotool key --window "$WID" F11
  sleep 1
}

nav_to() {
  WID=$(xdotool search --onlyvisible --class "Google-chrome" | tail -1)
  xdotool windowactivate --sync "$WID"
  # Focus address bar and navigate
  xdotool key --window "$WID" ctrl+l
  sleep 0.4
  xdotool type --clearmodifiers "$1"
  xdotool key Return
  sleep 3
}

scroll_down() {
  WID=$(xdotool search --onlyvisible --class "Google-chrome" | tail -1)
  for i in $(seq 1 "$1"); do
    xdotool key --window "$WID" Down
    sleep "$PAUSE"
  done
}

scroll_up() {
  WID=$(xdotool search --onlyvisible --class "Google-chrome" | tail -1)
  xdotool key --window "$WID" ctrl+Home
  sleep 0.3
}

wait_prompt() {
  echo ""
  echo "============================================"
  echo " $1"
  echo " Press ENTER when ready to continue..."
  echo "============================================"
  read -r
}

echo ""
echo "============================================"
echo "  TIX-DAO DEMO RECORDER"
echo "  Make sure your screen recorder is running"
echo "  (Ctrl+Alt+Shift+R on GNOME)"
echo "  Press ENTER to begin..."
echo "============================================"
read -r

# ── SCENE 1: Home / Landing ────────────────────
echo "[SCENE 1] Opening home page..."
open_url "$BASE"
sleep 2
scroll_down 8
sleep 2
scroll_down 12
sleep 2
scroll_up
sleep 1

# ── SCENE 2: Lock Tokens / ve$TICK ─────────────
echo "[SCENE 2] Navigating to /lock..."
nav_to "$BASE/lock"
sleep 1
scroll_down 5
sleep 1

wait_prompt "SCENE 2 — Connect your Phantom wallet now, then press ENTER"

scroll_down 5
sleep 2
scroll_up
sleep 1

# ── SCENE 3: Create DAO ─────────────────────────
echo "[SCENE 3] Navigating to /create..."
nav_to "$BASE/create"
sleep 1
scroll_down 5
sleep 2
scroll_up
sleep 1

# ── SCENE 4: Proposals ──────────────────────────
echo "[SCENE 4] Navigating to /proposals..."
nav_to "$BASE/proposals"
sleep 2
scroll_down 8
sleep 2

wait_prompt "SCENE 4 — Cast your vote (Vote Yes on the first proposal), then press ENTER"

scroll_down 10
sleep 2
scroll_up
sleep 1

# ── SCENE 5: Finance / RWA ──────────────────────
echo "[SCENE 5] Navigating to /finance..."
nav_to "$BASE/finance"
sleep 1
scroll_down 5
sleep 2

wait_prompt "SCENE 5 — Type a revenue amount (e.g. 50000) and click Request Advance, then press ENTER"

scroll_down 10
sleep 2
scroll_up
sleep 1

# ── SCENE 6: Outro / Home ───────────────────────
echo "[SCENE 6] Back to home for outro..."
nav_to "$BASE"
sleep 1
scroll_down 30
sleep 3

echo ""
echo "============================================"
echo "  DEMO COMPLETE — Stop your recorder now"
echo "  (Ctrl+Alt+Shift+R)"
echo "============================================"
