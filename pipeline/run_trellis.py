#!/usr/bin/env python3
"""Trellis 3D 재구성 실행 스크립트"""
import argparse
import sys
import json

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input image path")
    parser.add_argument("--output_dir", required=True, help="Output directory")
    args = parser.parse_args()

    try:
        import os
        import subprocess
        import sys
        # 경로 세팅
        trellis2_dir = "/workspace/tobigs/TRELLIS.2"
        trellis2_script = os.path.join(trellis2_dir, "trellis2_run.py")
        conda_prefix = "/workspace/tobigs/miniconda3"
        conda_env = "trellis311"
        # 환경 변수 세팅
        env = os.environ.copy()
        env["ATTN_BACKEND"] = "xformers"
        env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
        env["OPENCV_IO_ENABLE_OPENEXR"] = "1"
        # HuggingFace 캐시 경로
        hf_cache = "/workspace/tobigs/.hf_cache"
        os.makedirs(hf_cache, exist_ok=True)
        env["HF_HOME"] = hf_cache
        env["TRANSFORMERS_CACHE"] = f"{hf_cache}/transformers"
        env["HF_DATASETS_CACHE"] = hf_cache
        env["HF_HUB_CACHE"] = hf_cache
        env["HUGGINGFACE_HUB_CACHE"] = hf_cache
        # 토큰
        hf_token = env.get("HF_TOKEN") or env.get("HUGGINGFACE_HUB_TOKEN")
        env["HUGGINGFACE_HUB_TOKEN"] = hf_token
        env["HF_TOKEN"] = hf_token

        # miniconda 환경의 python을 직접 실행
        trellis_python = "/workspace/tobigs/miniconda3/envs/trellis311/bin/python"
        cmd = [
            trellis_python,
            trellis2_script,
            "--input", args.input,
            "--out_prefix", os.path.join(args.output_dir, "mesh")
        ]
        print(f"[INFO] Running: {' '.join(cmd)}", file=sys.stderr)
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, cwd=trellis2_dir)
        print(result.stdout)
        if result.returncode != 0:
            print(result.stderr, file=sys.stderr)
            print(json.dumps({"success": False, "error": result.stderr}), file=sys.stderr)
            sys.exit(1)
        # mesh.glb 경로 반환
        glb_path = os.path.join(args.output_dir, "mesh.glb")
        print(json.dumps({"success": True, "mesh_path": glb_path}))
        with torch.cuda.device(device):
            out = pipe.run(img)
        
        mesh = out[0] if isinstance(out, (list, tuple)) else out
        
        print(f"[INFO] Inference complete. GPU Memory Used: {torch.cuda.memory_allocated(0) / 1024**3:.2f} GB", file=sys.stderr)
        
        # GPU 메모리 정리 (GLB 변환 전)
        print(f"[INFO] Clearing GPU cache for GLB export...", file=sys.stderr)
        torch.cuda.empty_cache()
        import gc
        gc.collect()
        
        # Simplify mesh (더 적극적으로)
        if hasattr(mesh, "simplify"):
            mesh.simplify(8388608)  # 16M -> 8M (메모리 절약)
        
        # Export GLB
        os.makedirs(args.output_dir, exist_ok=True)
        glb_output = os.path.join(args.output_dir, "mesh.glb")
        
        print(f"[INFO] Exporting GLB (memory-optimized settings)...", file=sys.stderr)
        glb = o_voxel.postprocess.to_glb(
            vertices=mesh.vertices,
            faces=mesh.faces,
            attr_volume=mesh.attrs,
            coords=mesh.coords,
            attr_layout=mesh.layout,
            voxel_size=mesh.voxel_size,
            aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
            decimation_target=500_000,  # 1M -> 500K (메모리 절약)
            texture_size=2048,  # 4096 -> 2048 (메모리 절약)
            remesh=False,  # remesh 비활성화 (메모리 많이 사용)
            remesh_band=0,
            remesh_project=0,
            verbose=False
        )
        glb.export(glb_output, extension_webp=False)
        
        print(json.dumps({"success": True, "mesh_path": glb_output}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)