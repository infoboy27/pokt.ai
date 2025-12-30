#!/bin/bash
echo "Testing Traefik connectivity..."
echo ""
echo "1. Can Traefik reach Web?"
docker exec traefik wget -O- -T 2 http://host.docker.internal:4000 2>&1 | head -5
echo ""
echo "2. Can Traefik reach API?"
docker exec traefik wget -O- -T 2 http://host.docker.internal:3001/api/health 2>&1
echo ""
echo "3. Traefik routing config loaded?"
docker exec traefik cat /etc/traefik/services/poktai.yaml | grep -A 2 "poktai-web:"

















