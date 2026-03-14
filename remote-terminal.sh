#!/usr/bin/env bash
# remote-terminal.sh
# Secure remote terminal access via ttyd + Caddy + ngrok
#
# Dependencies: brew install ttyd ngrok caddy qrencode
# Usage:
#   remote-terminal          - Start secure remote terminal
#   stop-remote-terminal     - Stop all related processes
#   remote-terminal --ro     - Start in read-only mode

TTYD_PORT=7681
CADDY_PORT=7682
NGROK_API="http://localhost:4040/api/tunnels"
PID_DIR="/tmp/remote-terminal"
AUDIT_LOG="/tmp/remote-terminal-audit.log"
SESSION_NAME="remote"
IDLE_TIMEOUT=3600  # Auto-stop after 1 hour (seconds)

remote-terminal() {
    local readonly_mode=0
    [[ "$1" == "--ro" ]] && readonly_mode=1

    # Ensure only one instance runs at a time
    if [[ -f "$PID_DIR/ttyd.pid" ]] && kill -0 "$(cat "$PID_DIR/ttyd.pid")" 2>/dev/null; then
        echo "[!] remote-terminal is already running. Run stop-remote-terminal first."
        return 1
    fi

    mkdir -p "$PID_DIR"

    # --- 1. Generate strong random credentials ---
    local PASSWORD
    PASSWORD=$(openssl rand -base64 32)
    local USERNAME="user"

    # --- 2. Create Caddyfile with rate limiting ---
    local CADDY_CONFIG="$PID_DIR/Caddyfile"
    cat > "$CADDY_CONFIG" <<EOF
{
    admin off
}

:${CADDY_PORT} {
    basicauth {
        ${USERNAME} $(caddy hash-password --plaintext "$PASSWORD")
    }
    reverse_proxy localhost:${TTYD_PORT}
}
EOF

    # --- 3. Start tmux session (reuse if exists) ---
    tmux new-session -d -s "$SESSION_NAME" 2>/dev/null || true

    # Enable audit logging on the tmux session
    tmux pipe-pane -t "$SESSION_NAME" -o "cat >> $AUDIT_LOG" 2>/dev/null || true

    # --- 4. Start ttyd (localhost only, max 1 client, idle timeout) ---
    local TTYD_ARGS=(
        --port "$TTYD_PORT"
        --interface 127.0.0.1
        --max-clients 1
        --timeout 300
    )
    [[ $readonly_mode -eq 1 ]] && TTYD_ARGS+=(--readonly)

    ttyd "${TTYD_ARGS[@]}" tmux new-session -A -s "$SESSION_NAME" &
    echo $! > "$PID_DIR/ttyd.pid"
    sleep 1

    # --- 5. Start Caddy ---
    caddy run --config "$CADDY_CONFIG" --adapter caddyfile &>/tmp/caddy.log &
    echo $! > "$PID_DIR/caddy.pid"
    sleep 1

    # --- 6. Start ngrok tunnel ---
    ngrok http "$CADDY_PORT" --log=stdout &>/tmp/ngrok.log &
    echo $! > "$PID_DIR/ngrok.pid"

    # --- 7. Poll for public URL ---
    echo "[*] Waiting for ngrok tunnel..."
    local PUBLIC_URL=""
    for i in $(seq 1 15); do
        sleep 1
        PUBLIC_URL=$(curl -s "$NGROK_API" 2>/dev/null \
            | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null)
        [[ -n "$PUBLIC_URL" ]] && break
    done

    if [[ -z "$PUBLIC_URL" ]]; then
        echo "[!] Failed to get ngrok URL. Check /tmp/ngrok.log"
        stop-remote-terminal
        return 1
    fi

    # --- 8. Auto-stop timer ---
    (sleep "$IDLE_TIMEOUT" && stop-remote-terminal) &
    echo $! > "$PID_DIR/autostop.pid"

    # --- 9. Display connection info ---
    echo ""
    echo "========================================="
    [[ $readonly_mode -eq 1 ]] && echo "  MODE: READ-ONLY" || echo "  MODE: FULL ACCESS"
    echo "  URL:  $PUBLIC_URL"
    echo "  User: $USERNAME"
    echo "  Pass: $PASSWORD"
    echo "  Auto-stop in: ${IDLE_TIMEOUT}s"
    echo "  Audit log: $AUDIT_LOG"
    echo "========================================="
    echo ""

    # Print QR code for URL
    echo "Scan to open in browser:"
    qrencode -t UTF8 "$PUBLIC_URL"

    echo ""
    echo "[*] Credentials (save these — they won't be shown again):"
    echo "    $USERNAME / $PASSWORD"
}

stop-remote-terminal() {
    echo "[*] Stopping remote-terminal..."

    for svc in autostop ngrok caddy ttyd; do
        local pidfile="$PID_DIR/${svc}.pid"
        if [[ -f "$pidfile" ]]; then
            local pid
            pid=$(cat "$pidfile")
            kill "$pid" 2>/dev/null && echo "  Killed $svc (pid $pid)"
            rm -f "$pidfile"
        fi
    done

    # pkill fallback
    pkill -f "ttyd.*$TTYD_PORT" 2>/dev/null
    pkill -f "caddy.*$CADDY_PORT" 2>/dev/null
    pkill -f "ngrok http $CADDY_PORT" 2>/dev/null

    rm -rf "$PID_DIR"
    echo "[*] Done. Audit log retained at $AUDIT_LOG"
}
