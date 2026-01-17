#!/bin/bash
# pipeline_service 웹 서버 실행 스크립트 (Flask)

cd /workspace/tobigs/git_upload_yong_dir/Curat3R/pipeline_service
source venv/bin/activate
python pipeline_server.py
