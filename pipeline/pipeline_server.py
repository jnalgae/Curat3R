"""Pipeline server: CLIP filtering + StableFast3D 3D reconstruction"""

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
SF3D_ENV = "/workspace/tobigs/stable-fast-3d_server/stable-fast-3d-env/bin/python"
SF3D_SCRIPT = "/workspace/tobigs/stable-fast-3d_server/stable-fast-3d/run.py"
SF3D_LOCAL_MODEL = "/workspace/tobigs/pipeline_service/models/stabilityai_stable-fast-3d"
TRELLIS_ENV = "/workspace/tobigs/miniconda3/envs/trellis311/bin/python"
TRELLIS_SCRIPT = "/workspace/tobigs/pipeline_service/run_trellis.py"
WORKSPACE_DIR = "/workspace/tobigs/pipeline_service/workspace"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

os.makedirs(WORKSPACE_DIR, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_clip_filter_subprocess(image_path):
    """Run CLIP filtering as a separate process (clip_filter.py)."""
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

def run_stablefast3d(image_path, output_dir):
    """Run StableFast3D 3D reconstruction (fast mode)."""
    try:
        use_local_model = os.path.exists(os.path.join(SF3D_LOCAL_MODEL, "model.safetensors"))
        
        cmd = [
            SF3D_ENV, SF3D_SCRIPT, image_path,
            "--output-dir", output_dir,
            "--texture-resolution", "1024",
            "--remesh_option", "none",
            "--device", "cuda"
        ]
        
        if use_local_model:
            print(f"[INFO] Using local SF3D model (CUDA mode)", file=sys.stderr)
            cmd.extend(["--pretrained-model", SF3D_LOCAL_MODEL])
        
        env = os.environ.copy()
        env["PYTHONPATH"] = "/workspace/tobigs/stable-fast-3d_server/stable-fast-3d"
        env["HF_HOME"] = "/workspace/tobigs/.hf_cache"
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
            cwd="/workspace/tobigs/stable-fast-3d_server/stable-fast-3d",
            env=env
        )
        
        if result.returncode != 0:
            if "GatedRepoError" in result.stderr or "401 Client Error" in result.stderr:
                return {"success": False, "error": "StableFast3D 모델 필요 (./download_sf3d_model.sh 실행)"}
            return {"success": False, "error": f"StableFast3D 실행 오류: {result.stderr[:200]}"}
        
        mesh_path = os.path.join(output_dir, "0", "mesh.glb")
        if os.path.exists(mesh_path):
            return {"success": True, "mesh_path": mesh_path}
        return {"success": False, "error": "3D 모델 파일이 생성되지 않았습니다"}
        
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "StableFast3D 실행 시간 초과 (10분)"}
    except Exception as e:
        return {"success": False, "error": f"StableFast3D 오류: {str(e)}"}

def run_trellis(image_path, output_dir):
    """Run Trellis 3D reconstruction (quality mode)."""
    try:
        trellis_runner = os.path.join(os.path.dirname(__file__), "run_trellis.py")
        # Set this to the actual Trellis working directory (e.g., /workspace/tobigs/TRELLIS.2)
        trellis_workdir = "/workspace/tobigs/TRELLIS.2"
        if not os.path.exists(trellis_workdir):
            return {"success": False, "error": "Trellis not installed. Please use Fast mode (StableFast3D) instead."}

        cmd = [
            TRELLIS_ENV,
            trellis_runner,
            "--input", image_path,
            "--output_dir", output_dir
        ]

        # Set GPU-related environment variables
        env = os.environ.copy()
        env["CUDA_VISIBLE_DEVICES"] = "0"
        env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
        env["ATTN_BACKEND"] = "xformers"
        # Pass HuggingFace token from environment variables
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
            timeout=1800,  # 30-minute timeout (Trellis can be slow)
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
            # Find JSON in the last stdout lines (may be mixed with logs)
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
                # If JSON not found, check for mesh.glb file
                mesh_path = os.path.join(output_dir, "mesh.glb")
                if os.path.exists(mesh_path):
                    return {"success": True, "mesh_path": mesh_path}
                return {"success": False, "error": "Trellis result not found"}
                
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
    """Reconstruct only (skip filtering)."""
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    if not os.path.exists(task_dir):
        return jsonify({"error": "작업을 찾을 수 없습니다"}), 404
    
    # Model selection (fast/quality)
    model_type = request.json.get('model', 'fast') if request.is_json else 'fast'
    
    try:
        image_files = [f for f in os.listdir(task_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        if not image_files:
            return jsonify({"error": "이미지 파일을 찾을 수 없습니다"}), 404
        
        image_path = os.path.join(task_dir, image_files[0])
        print(f"[INFO] Starting reconstruction: {task_id} (model: {model_type})", file=sys.stderr)
        
        output_dir = os.path.join(task_dir, f"{model_type}_output")
        os.makedirs(output_dir, exist_ok=True)
        
        # Model selection (fast/quality)
        if model_type == 'quality':
            result = run_trellis(image_path, output_dir)
        else:  # fast (default)
            result = run_stablefast3d(image_path, output_dir)
        
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
    """Filter an image only."""
    if 'image' not in request.files:
        return jsonify({"error": "이미지 파일이 필요합니다"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "지원하지 않는 파일 형식입니다"}), 400
    
    # Create temporary task directory
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        image_path = os.path.join(task_dir, filename)
        file.save(image_path)
        
        # Run CLIP filtering
        filter_result = run_clip_filter_subprocess(image_path)
        
        return jsonify({
            "task_id": task_id,
            "filter_result": filter_result
        })
        
    except Exception as e:
        # On error, remove temporary task directory
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/process', methods=['POST'])
def process_image():
    """Run full pipeline: filtering + 3D reconstruction."""
    if 'image' not in request.files:
        return jsonify({"error": "이미지 파일이 필요합니다"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "지원하지 않는 파일 형식입니다"}), 400
    
    # Create temporary task directory
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        image_path = os.path.join(task_dir, filename)
        file.save(image_path)
        
        # Step 1: CLIP filtering
        print(f"[INFO] Starting CLIP filtering for task {task_id}", file=sys.stderr)
        filter_result = run_clip_filter_subprocess(image_path)
        print(f"[INFO] CLIP result: {filter_result}", file=sys.stderr)
        
        # If not accepted, do not proceed to reconstruction
        if filter_result.get("status") != "accept":
            print(f"[INFO] Image rejected at filtering stage: {filter_result.get('status')}", file=sys.stderr)
            return jsonify({
                "task_id": task_id,
                "stage": "filtering",
                "filter_result": filter_result,
                "message": "이미지가 필터링을 통과하지 못했습니다"
            })
        
        # Step 2: StableFast3D reconstruction
        print(f"[INFO] Starting StableFast3D reconstruction for task {task_id}", file=sys.stderr)
        sf3d_output_dir = os.path.join(task_dir, "sf3d_output")
        os.makedirs(sf3d_output_dir, exist_ok=True)
        
        sf3d_result = run_stablefast3d(image_path, sf3d_output_dir)
        print(f"[INFO] StableFast3D result: {sf3d_result}", file=sys.stderr)
        
        if not sf3d_result["success"]:
            return jsonify({
                "task_id": task_id,
                "stage": "reconstruction",
                "filter_result": filter_result,
                "reconstruction_error": sf3d_result["error"]
            }), 500
        
        # Success
        return jsonify({
            "task_id": task_id,
            "stage": "completed",
            "filter_result": filter_result,
            "mesh_path": sf3d_result["mesh_path"],
            "message": "3D 재구성이 완료되었습니다"
        })
        
    except Exception as e:
        # On error, remove temporary task directory
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/download/<task_id>', methods=['GET'])
def download_model(task_id):
    """Download generated 3D model."""
    # fast_output 또는 quality_output 또는 sf3d_output(레거시) 경로 시도
    possible_paths = [
        os.path.join(WORKSPACE_DIR, task_id, "fast_output", "0", "mesh.glb"),
        os.path.join(WORKSPACE_DIR, task_id, "quality_output", "mesh.glb"),
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
    """Cleanup task directory."""
    task_dir = os.path.join(WORKSPACE_DIR, task_id)
    
    if os.path.exists(task_dir):
        shutil.rmtree(task_dir, ignore_errors=True)
        return jsonify({"message": "정리 완료"})
    else:
        return jsonify({"error": "작업을 찾을 수 없습니다"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
