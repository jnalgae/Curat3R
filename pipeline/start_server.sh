./setup_all.sh#!/bin/bash
# 파이프라인 서버 시작 스크립트

cd /workspace/tobigs/pipeline_service

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
echo "Installing dependencies..."
pip install -q -r requirements.txt

# 서버 시작
echo "Starting pipeline server on port 5000..."
python pipeline_server.py
