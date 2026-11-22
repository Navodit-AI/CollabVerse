#!/bin/bash
# Usage: TOKEN=<jwt from /api/auth/login> ./scripts/verify_social.sh
: "${TOKEN:?Set TOKEN to a JWT from /api/auth/login}"
API="${API:-http://localhost:10000/api}"

echo "1. Creating Post..."
POST_RES=$(curl -s -X POST "$API/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Social Test","description":"Testing likes comments","domain":"Web","skills":["Testing"]}')
echo "$POST_RES"
POST_ID=$(echo "$POST_RES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "POST_ID: $POST_ID"

echo -e "\n2. Adding Comment..."
curl -s -X POST "$API/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"postId\":\"$POST_ID\",\"content\":\"This is a test comment!\"}"

echo -e "\n3. Toggling Like..."
curl -s -X POST "$API/likes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"postId\":\"$POST_ID\"}"

echo -e "\n4. Fetching Comments..."
curl -s "$API/comments/$POST_ID"

echo -e "\n5. Fetching Likes..."
curl -s "$API/likes/$POST_ID"
