#!/bin/bash
# Run this to create tables in YOUR Supabase project (from .env.local)
# Requires: supabase CLI (npx supabase) and project access token

set -e
cd "$(dirname "$0")/.."

# Extract project ref from NEXT_PUBLIC_SUPABASE_URL
URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
if [ -z "$URL" ]; then
  echo "Loading .env.local..."
  set -a
  source .env.local 2>/dev/null || true
  set +a
  URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
fi

if [ -z "$URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
  exit 1
fi

REF=$(echo "$URL" | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')
echo "Project ref: $REF"

# Run setup SQL via supabase db execute (requires linked project)
if command -v supabase &>/dev/null; then
  echo "Linking and pushing..."
  supabase link --project-ref "$REF" 2>/dev/null || true
  supabase db push
else
  echo "Supabase CLI not found. Run the SQL manually:"
  echo "1. Open https://supabase.com/dashboard/project/$REF/sql/new"
  echo "2. Paste contents of supabase/setup.sql"
  echo "3. Click Run"
  exit 1
fi
