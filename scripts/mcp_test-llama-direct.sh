#!/bin/bash

# Direct test of Llama API integration
# This tests the Llama API endpoint directly

echo "=== Testing Llama API Integration ==="
echo ""

echo "Test 1: Gas price query"
curl -X POST http://localhost:8000/api/llm/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the current gas price?","network":"eth"}' \
  | jq '.'

echo ""
echo "=== Test Complete ==="

