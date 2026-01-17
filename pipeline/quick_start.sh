#!/bin/bash

# 3D Reconstruction Pipeline - Quick Start Script
# 파이프라인 서버와 웹 앱을 동시에 실행합니다

echo "🚀 Starting 3D Reconstruction Pipeline..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 파이프라인 서버 실행 확인
echo -e "${BLUE}[1/3] Checking pipeline server...${NC}"
PIPELINE_RUNNING=$(curl -s http://localhost:5000/api/health 2>/dev/null)

if [ -z "$PIPELINE_RUNNING" ]; then
    echo -e "${RED}Pipeline server is not running. Starting...${NC}"
    echo ""
    echo "Run this command in a separate terminal:"
    echo -e "${GREEN}cd /workspace/gyuwon/pipeline_service && ./start_server.sh${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Pipeline server is running${NC}"
fi

# (YOLO 필터링은 제거되어 이 단계는 더 이상 필요하지 않습니다) # YOLO filtering removed

# 3. StableFast3D 환경 확인
echo -e "${BLUE}[3/3] Checking StableFast3D environment...${NC}"
SF3D_ENV="/workspace/jungwoo/stable-fast-3d_server/stable-fast-3d_env/bin/python"

if [ -f "$SF3D_ENV" ]; then
    echo -e "${GREEN}✓ StableFast3D environment found${NC}"
else
    echo -e "${RED}✗ StableFast3D environment not found at $SF3D_ENV${NC}"
    echo "Please set up StableFast3D environment first"
fi

echo ""
echo -e "${GREEN}=========================${NC}"
echo -e "${GREEN}Setup Instructions:${NC}"
echo -e "${GREEN}=========================${NC}"
echo ""
echo "1. Start Pipeline Server (Terminal 1):"
echo -e "   ${BLUE}cd /workspace/gyuwon/pipeline_service${NC}"
echo -e "   ${BLUE}chmod +x start_server.sh${NC}"
echo -e "   ${BLUE}./start_server.sh${NC}"
echo ""
echo "2. Start Web App (Terminal 2):"
echo -e "   ${BLUE}cd /workspace/gyuwon/my-3d-archive${NC}"
echo -e "   ${BLUE}npm install${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Open in browser:"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "4. Click '🎨 AI 3D 재구성' button and upload an image!"
echo ""
