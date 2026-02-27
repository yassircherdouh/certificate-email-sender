#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <EVENT_NAME>"
  echo "Example: $0 ETCODE3"
  exit 1
fi

EVENT="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVENT_DIR="$ROOT_DIR/events/$EVENT"

echo "Creating event structure for: $EVENT"

mkdir -p "$EVENT_DIR/data"
mkdir -p "$EVENT_DIR/templates"
mkdir -p "$EVENT_DIR/assets"
mkdir -p "$EVENT_DIR/certificates"
mkdir -p "$EVENT_DIR/certificates/participants"
mkdir -p "$EVENT_DIR/certificates/organizers"

# Create a default config.json if it doesn't exist
CONFIG_FILE="$EVENT_DIR/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" <<EOF
{
  "name": "$EVENT",
  "fromName": "$EVENT - ETC",
  "subjects": {
    "participants": "Certificate of Participation - $EVENT",
    "organizers": "Thank You - $EVENT Organizer"
  },
  "certificate": {
    "participants": {
      "fontPath": "Formula1-Regular_web_0.ttf",
      "xOffset": 0,
      "yOffset": -85,
      "fontSize": 70
    },
    "organizers": {
      "fontPath": "Formula1-Regular_web_0.ttf",
      "xOffset": 0,
      "yOffset": -70,
      "fontSize": 80
    }
  }
}
EOF
  echo "Created default config: events/$EVENT/config.json"
else
  echo "Config already exists, skipping: events/$EVENT/config.json"
fi

# Seed empty data files if they don't exist
for ROLE in participants organizers; do
  DATA_FILE="$EVENT_DIR/data/$ROLE.json"
  if [ ! -f "$DATA_FILE" ]; then
    echo "[]" > "$DATA_FILE"
    echo "Created data file: events/$EVENT/data/$ROLE.json"
  fi
done

# Seed basic HTML templates if they don't exist
if [ ! -f "$EVENT_DIR/templates/participants.html" ]; then
  cat > "$EVENT_DIR/templates/participants.html" <<'EOF'
<!DOCTYPE html>
<html>
  <body>
    <p>Dear {{fullname}},</p>
    <p>Thank you for participating in our event.</p>
  </body>
</html>
EOF
  echo "Created template: events/$EVENT/templates/participants.html"
fi

if [ ! -f "$EVENT_DIR/templates/organizers.html" ]; then
  cat > "$EVENT_DIR/templates/organizers.html" <<'EOF'
<!DOCTYPE html>
<html>
  <body>
    <p>Dear {{fullname}},</p>
    <p>Thank you for organizing and contributing to our event.</p>
  </body>
</html>
EOF
  echo "Created template: events/$EVENT/templates/organizers.html"
fi

echo "Done. Now add role-specific PNGs into events/$EVENT/assets/<role>.png and fill data JSON files."

