#!/bin/bash
# pipeline_service 서버 종료 스크립트

pkill -9 -f pipeline_server

echo "pipeline_server.py 프로세스가 종료되었습니다."
