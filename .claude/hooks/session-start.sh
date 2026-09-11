#!/bin/bash
# Installs the `graphifyy` package so the graphify skill (/graphify) works.
# The remote container is ephemeral, so this runs on each web session start.
set -euo pipefail

# Make user-local installs reachable this session and for the rest of it.
export PATH="$HOME/.local/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
fi

# Idempotent: nothing to do if graphify is already available.
if command -v graphify >/dev/null 2>&1; then
  exit 0
fi

# Install via whichever tool is present (uv preferred, then pipx, then pip).
if command -v uv >/dev/null 2>&1; then
  uv tool install graphifyy >/dev/null 2>&1 || true
elif command -v pipx >/dev/null 2>&1; then
  pipx install graphifyy >/dev/null 2>&1 || true
elif command -v pip3 >/dev/null 2>&1; then
  pip3 install --user graphifyy >/dev/null 2>&1 || true
fi

command -v graphify >/dev/null 2>&1 || echo "graphify: install failed; /graphify will not work until graphifyy is installed" >&2
