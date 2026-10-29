#!/usr/bin/env bash
# Points the Telegram bot at the telegram-webhook Edge Function.
# Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... SUPABASE_URL=https://<ref>.supabase.co \
#        scripts/telegram-set-webhook.sh
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?}" "${TELEGRAM_WEBHOOK_SECRET:?}" "${SUPABASE_URL:?}"
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=${SUPABASE_URL%/}/functions/v1/telegram-webhook" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["message"]' \
  --data-urlencode "drop_pending_updates=false"
echo
