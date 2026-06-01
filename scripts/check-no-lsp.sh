#!/usr/bin/env sh
set -eu
if [ -d packages/language-server ] || [ -d packages/lsp ]; then
  echo "error: language-server packages are forbidden in ts2shell"
  exit 1
fi
echo "ok: no LSP packages"
