"""통합 파이프라인 서버: CLIP 필터링 + SPAR3D 3D 재구성"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import subprocess
import json
import uuid
from werkzeug.utils import secure_filename
import shutil

app = Flask(__name__)
CORS(app)

CLIP_ENV = "/workspace/tobigs/pipeline_service/clip-env/bin/python"
SPAR3D_ENV = "/workspace/tobigs/sangwoo/miniconda3/envs/sangwoo-spar3d/bin/python"
SPAR3D_SCRIPT = "/workspace/tobigs/sangwoo/stable-point-aware-3d/run.py"
SPAR3D_DIR = "/workspace/tobigs/sangwoo/stable-point-aware-3d"
TRELLIS_ENV = "/workspace/tobigs/miniconda3/envs/trellis311/bin/python"
TRELLIS_SCRIPT = "/workspace/tobigs/pipeline_service/run_trellis.py"
WORKSPACE_DIR = "/workspace/tobigs/pipeline_service/workspace"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

os.makedirs(WORKSPACE_DIR, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_clip_filter_subprocess(image_path):
    """CLIP 필터링 실행 (clip_filter.py를 별도 프로세스로 실행)"""
    try:
        clip_runner = os.path.join(os.path.dirname(__file__), "clip_filter.py")
        result = subprocess.run(
            [CLIP_ENV, clip_runner, image_path],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=os.path.dirname(__file__)
        )
        if result.returncode != 0:
            print(f"[CLIP ERROR] {result.stderr}", file=sys.stderr)
            return {"status": "error", "reasons": [f"CLIP 실행 오류: {result.stderr.strip()}"]}
        output = result.stdout.strip()
        if not output:
            return {"status": "error", "reasons": ["CLIP 출력 없음"]}
        return json.loads(output)
    except subprocess.TimeoutExpired:
        return {"status": "error", "reasons": ["CLIP 실행 시간 초과 (60초)"]}
    except json.JSONDecodeError:
        return {"status": "error", "reasons": ["CLIP 결과 파싱 실패"]}
    except Exception as e:
        print(f"[CLIP ERROR] {str(e)}", file=sys.stderr)
        return {"status": "error", "reasons": [f"CLIP 오류: {str(e)}"]}

def run_spar3d(image_path, output_dir):
    """SPAR3D 3D 재구성 실행 (Fast 모드)"""
    try:
        cmd = [
            SPAR3D_ENV, SPAR3D_SCRIPT, image_path,
            "--output-dir", output_dir,
            "--texture-resolution", "1024",
            "--remesh_option", "triangle",
            "--reduction_count_type", "vertex",
            "--target_count", "50000",
            "--device", "cuda"
        ]
        
        env = os.environ.copy()
        env["PYTHONPATH"] = SPAR3D_DIR
        env["HF_HOME"] = "/workspace/tobigs/.hf_cache"
        env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True,max_split_size_mb:128"
        
        # HuggingFace 토큰 설정
        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")
        env["HF_TOKEN"] = hf_token
        env["HUGGINGFACE_HUB_TOKEN"] = hf_token
        
        print(f"[INFO] Starting SPAR3D (Fast mode)...", file=sys.stderr)
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
            cwd=SPAR3D_DIR,
            env=env
        )
        
        print(f"[DEBUG] SPAR3D stdout: {result.stdout[:500]}", file=sys.stderr)
        print(f"[DEBUG] SPAR3D stderr: {result.stderr[:500]}", file=sys.stderr)
        print(f"[DEBUG] SPAR3D returncode: {result.returncode}", file=sys.stderr)
        
        # 파일 생성 여부로 성공 판단 (run.py는 output_dir/0/mesh.glb 형식으로 저장)
        mesh_path = os.path.join(output_dir, "0", "mesh.glb")
        if os.path.exists(mesh_path):
            print(f"[INFO] SPAR3D Success! Mesh file created: {mesh_path}", file=sys.stderr)
            return {"success": True, "mesh_path": mesh_path}
        
        # 파일이 없으면 실제 에러 확인
        if result.returncode != 0:
            if "GatedRepoError" in result.stderr or "401 Client Error" in result.stderr:
                return {"success": False, "error": "SPAR3D 모델 필요 (Hugging Face 로그인 필요)"}
            if "Traceback" in result.stderr or "Error" in result.stderr:
                return {"success": False, "error": f"SPAR3D 실행 오류: {result.stderr[:300]}"}
        
        return {"success": False, "error": "3D 모델 파일이 생성되지 않았습니다"}
        
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "SPAR3D 실행 시간 초과 (10분)"}
    except Exception as e:
        return {"success": False, "error": f"SPAR3D 오류: {str(e)}"}

def run_trellis(image_path, output_dir):
    """Trellis 3D 재구성 실행 (Quality 모드)"""
    try:
        trellis_runner = os.path.join(os.path.dirname(__file__), "run_trellis.py")
        # 실제 Trellis 작업 디렉토리(/workspace/tobigs/TRELLIS.2)로 변경
        trellis_workdir = "/workspace/tobigs/TRELLIS.2"
        if not os.path.exists(trellis_workdir):
            return {"success": False, "error": "Trellis not installed. Please use Fast mode (SPAR3D) instead."}

        cmd = [
            TRELLIS_ENV,
            trellis_runner,
            "--input", image_path,
            "--output_dir", output_dir
        ]

        # GPU 환경 변수 설정
        env = os.environ.copy()
        env["CUDA_VISIBLE_DEVICES"] = "0"
        env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
        env["ATTN_BACKEND"] = "xformers"
        # HuggingFace 토큰 전달 (환경 변수에서 가져오기)
        if "HF_TOKEN" in os.environ:
            env["HF_TOKEN"] = os.environ["HF_TOKEN"]
        if "HUGGINGFACE_HUB_TOKEN" in os.environ:
            env["HUGGINGFACE_HUB_TOKEN"] = os.environ["HUGGINGFACE_HUB_TOKEN"]

        print(f"[INFO] Starting Trellis (Quality mode)...", file=sys.stderr)
        print(f"[DEBUG] Command: {' '.join(cmd)}", file=sys.stderr)
        print(f"[DEBUG] CWD: {trellis_workdir}", file=sys.stderr)
        print(f"[DEBUG] Image: {image_path}", file=sys.stderr)
        print(f"[DEBUG] Output: {output_dir}", file=sys.stderr)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800,  # 30분 타임아웃 (Trellis는 시간이 오래 걸림)
            cwd=trellis_workdir,
            env=env
        )
        
        print(f"[DEBUG] Trellis return code: {result.returncode}", file=sys.stderr)
        print(f"[DEBUG] Trellis stdout: {result.stdout[:500]}", file=sys.stderr)
        print(f"[DEBUG] Trellis stderr: {result.stderr[:500]}", file=sys.stderr)
        
        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else "알 수 없는 오류"
            print(f"[TRELLIS ERROR] {error_msg}", file=sys.stderr)
            return {"success": False, "error": f"Trellis 실행 오류: {error_msg[:200]}"}
        
        # Parse JSON output
        try:
            output = result.stdout.strip()
            # stdout의 마지막 줄에서 JSON 찾기 (로그와 섞여있을 수 있음)
            lines = output.split('\n')
            json_line = None
            for line in reversed(lines):
                line = line.strip()
                if line.startswith('{') and line.endswith('}'):
                    json_line = line
                    break
            
            if json_line:
                trellis_result = json.loads(json_line)
                if not trellis_result.get("success"):
                    return {"success": False, "error": trellis_result.get("error", "Trellis 실행 실패")}
                return trellis_result
            else:
                # JSON을 찾을 수 없으면 mesh.glb 파일 존재 확인
                mesh_path = os.path.join(output_dir, "mesh.glb")
                if os.path.exists(mesh_path):
                    return {"success": True, "mesh_path": mesh_path}
                return {"success": False, "error": "Trellis 결과를 찾을 수 없습니다"}
                
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON decode error: {e}", file=sys.stderr)
            mesh_path = os.path.join(output_dir, "mesh.glb")
            if os.path.exists(mesh_path):
                return {"success": True, "mesh_path": mesh_path}
            return {"success": False, "error": f"Trellis 결과 파싱 실패: {str(e)}"}
        
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Trellis 실행 시간 초과 (30분)"}
    except Exception as e:
        print(f"[TRELLIS ERROR] {str(e)}", file=sys.stderr)
        return {"success": False, "error": f"Trellis 오류: {str(e)}"}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/api/reconstruct/<task_id>', methods=['POST'])
def reconstruct_only(task_id):
    """필터링 건너뛰고 3D 재구성만 수행"""
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    if not os.path.exists(task_dir):
        return jsonify({"error": "작업을 찾을 수 없습니다"}), 404
    
    # 모델 선택 (fast/quality)
    model_type = request.json.get('model', 'fast') if request.is_json else 'fast'
    
    try:
        image_files = [f for f in os.listdir(task_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        if not image_files:
            return jsonify({"error": "이미지 파일을 찾을 수 없습니다"}), 404
        
        image_path = os.path.join(task_dir, image_files[0])
        print(f"[INFO] Starting reconstruction: {task_id} (model: {model_type})", file=sys.stderr)
        
        output_dir = os.path.join(task_dir, f"{model_type}_output")
        os.makedirs(output_dir, exist_ok=True)
        
        # 모델 선택
        if model_type == 'quality':
            result = run_trellis(image_path, output_dir)
        else:  # fast (기본값)
            result = run_spar3d(image_path, output_dir)
        
        print(f"[DEBUG] Result from {model_type}: {result}", file=sys.stderr)
        
        if not result.get("success"):
            error_msg = result.get("error", "알 수 없는 오류")
            print(f"[ERROR] Reconstruction failed: {error_msg}", file=sys.stderr)
            return jsonify({
                "task_id": task_id,
                "stage": "reconstruction",
                "model": model_type,
                "reconstruction_error": error_msg
            }), 500
        
        mesh_path = result.get("mesh_path")
        if not mesh_path or not os.path.exists(mesh_path):
            print(f"[ERROR] Mesh file not found: {mesh_path}", file=sys.stderr)
            return jsonify({
                "task_id": task_id,
                "stage": "reconstruction",
                "model": model_type,
                "reconstruction_error": "생성된 3D 모델 파일을 찾을 수 없습니다"
            }), 500
        
        return jsonify({
            "task_id": task_id,
            "stage": "completed",
            "model": model_type,
            "mesh_path": mesh_path
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Exception in reconstruct: {str(e)}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

@app.route('/api/filter', methods=['POST'])
def filter_image():
    """이미지 필터링만 수행"""
    if 'image' not in request.files:
        return jsonify({"error": "이미지 파일이 필요합니다"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "지원하지 않는 파일 형식입니다"}), 400
    
    # 임시 디렉토리 생성
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    try:
        # 파일 저장
        filename = secure_filename(file.filename)
        image_path = os.path.join(task_dir, filename)
        file.save(image_path)
        
        # CLIP 필터링 실행
        filter_result = run_clip_filter_subprocess(image_path)
        
        return jsonify({
            "task_id": task_id,
            "filter_result": filter_result
        })
        
    except Exception as e:
        # 에러 발생 시 임시 디렉토리 삭제
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/process', methods=['POST'])
def process_image():
    """전체 파이프라인 수행: 필터링 + 3D 재구성"""
    if 'image' not in request.files:
        return jsonify({"error": "이미지 파일이 필요합니다"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "지원하지 않는 파일 형식입니다"}), 400
    
    # 임시 디렉토리 생성
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    try:
        # 파일 저장
        filename = secure_filename(file.filename)
        image_path = os.path.join(task_dir, filename)
        file.save(image_path)
        
        # 1단계: CLIP 필터링
        print(f"[INFO] Starting CLIP filtering for task {task_id}", file=sys.stderr)
        filter_result = run_clip_filter_subprocess(image_path)
        print(f"[INFO] CLIP result: {filter_result}", file=sys.stderr)
        
        # accept가 아니면 3D 재구성 하지 않음
        if filter_result.get("status") != "accept":
            print(f"[INFO] Image rejected at filtering stage: {filter_result.get('status')}", file=sys.stderr)
            return jsonify({
                "task_id": task_id,
                "stage": "filtering",
                "filter_result": filter_result,
                "message": "이미지가 필터링을 통과하지 못했습니다"
            })
        
        # 2단계: SPAR3D 3D 재구성
        print(f"[INFO] Starting SPAR3D reconstruction for task {task_id}", file=sys.stderr)
        spar3d_output_dir = os.path.join(task_dir, "spar3d_output")
        os.makedirs(spar3d_output_dir, exist_ok=True)
        
        spar3d_result = run_spar3d(image_path, spar3d_output_dir)
        print(f"[INFO] SPAR3D result: {spar3d_result}", file=sys.stderr)
        
        if not spar3d_result["success"]:
            return jsonify({
                "task_id": task_id,
                "stage": "reconstruction",
                "filter_result": filter_result,
                "reconstruction_error": spar3d_result["error"]
            }), 500
        
        # 성공
        return jsonify({
            "task_id": task_id,
            "stage": "completed",
            "filter_result": filter_result,
            "mesh_path": spar3d_result["mesh_path"],
            "message": "3D 재구성이 완료되었습니다"
        })
        
    except Exception as e:
        # 에러 발생 시 임시 디렉토리 삭제
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/download/<task_id>', methods=['GET'])
def download_model(task_id):
    """생성된 3D 모델 다운로드"""
    # fast_output(SPAR3D) 또는 quality_output(Trellis) 또는 spar3d_output/sf3d_output(레거시) 경로 시도
    possible_paths = [
        os.path.join(WORKSPACE_DIR, task_id, "fast_output", "0", "mesh.glb"),
        os.path.join(WORKSPACE_DIR, task_id, "quality_output", "mesh.glb"),
        os.path.join(WORKSPACE_DIR, task_id, "spar3d_output", "0", "mesh.glb"),
        os.path.join(WORKSPACE_DIR, task_id, "sf3d_output", "0", "mesh.glb"),
    ]
    
    mesh_path = None
    for path in possible_paths:
        if os.path.exists(path):
            mesh_path = path
            break
    
    if not mesh_path:
        return jsonify({"error": "파일을 찾을 수 없습니다"}), 404
    
    return send_file(
        mesh_path,
        mimetype='model/gltf-binary',
        as_attachment=True,
        download_name='model.glb'
    )

@app.route('/api/cleanup/<task_id>', methods=['DELETE'])
def cleanup_task(task_id):
    """작업 디렉토리 정리"""
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    
    if os.path.exists(task_dir):
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"message": "정리 완료"})
    else:
        return jsonify({"error": "작업을 찾을 수 없습니다"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
