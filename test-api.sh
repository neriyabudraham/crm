#!/bin/bash
BASE_URL="http://localhost:3010/api"

echo "1. Checking Auth List..."
curl -X GET "$BASE_URL/auth/list"
echo -e "\n\n2. Testing Login (Admin)..."
# כאן אתה צריך להחליף את ה-ID לפי מה שיש ב-DB
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"userId": 1, "password": "123456"}' | grep -oP '(?<="token":")[^"]*')

echo "Token received: ${TOKEN:0:10}..."

echo -e "\n3. Fetching Clients with Token..."
curl -X GET "$BASE_URL/clients?type=course" -H "Authorization: Bearer $TOKEN"

echo -e "\n\n4. Testing Global Search..."
curl -X GET "$BASE_URL/clients/search?q=test" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nBackend Verification Complete."
