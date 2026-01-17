import torch
import clip
from PIL import Image
import os

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

PROMPTS_MAP = {
    0: [
        "An incomplete image that is only partially loaded.",
        "A photo covered by a large solid color block.",
        "A corrupted file with rendering errors.",
        "Glitch art with digital artifacts."
    ],
    1: [
        "A very blurry photo where details are unrecognizable.",
        "Severe pixelation due to low resolution.",
        "Out of focus photography."
    ],
    2: [
        "A photo containing a human being, person, or people.",
        "A human figure in the frame.",
        "A man, woman, or child.",
        "A portrait or full body shot of a person.",
        "A panoramic landscape of nature or city."
    ],
    3: [
        "A transparent glass or water.",
        "A reflective mirror surface.",
        "An image where the object is cut off by the frame."
    ],
    4: [
        "A background with a brick wall, stone fence, or house siding.",
        "Windows, doors, or architectural details behind the object.",
        "Dense bushes, hedges, or trees directly behind the object.",
        "A busy chaotic scene with urban clutter."
    ],
    5: [
        "A product photo isolated on a plain white or solid color background.",
        "A studio shot with a solid smooth wall.",
        "A minimalist photo with a black or dark background.",
        "A high quality 3D render or cartoon character.",
        "A single object on a large open grass lawn.",
        "An object sitting on an empty floor or pavement.",
        "Delicious food photography."
    ]
}

# Labels and reasons exposed to the frontend
RESULTS_INFO = {
    0: ("[ 시 스 템 반 려 ]", "파일 데이터 손상 (로딩 중단/깨짐)", "👉 정상적인 이미지 파일이 아닙니다(손상/오류).", "파일"),
    1: ("[ 화 질 반 려 ]", "심한 흐림 또는 저해상도", "👉 사진이 너무 흐립니다. 초점을 맞추고 밝은 곳에서 다시 촬영해주세요.", "심한"),
    2: ("[ 대 상 반 려 ]", "사람 또는 풍경 (3D 변환 불가)", "👉 사람이나 광활한 풍경은 3D 변환 대상이 아닙니다.", "사람"),
    3: ("[ 기 술 반 려 ]", "투명/반사 재질 또는 잘림", "👉 객체가 잘렸거나 투명/반사 재질입니다. 온전한 불투명 객체로 다시 시도해주세요.", "투명/반사"),
    4: ("[ 환 경 반 려 ]", "배경에 구조물이 많음", "👉 객체 뒤가 복잡합니다. 더 넓고 트인 공간이나 깔끔한 벽 앞에서 찍어보세요.", "배경에"),
    5: ("[ 합 격 ]", "3D 생성 진행 가능", "👉 완벽합니다! 배경과 객체가 모두 훌륭합니다. 3D 생성을 시작합니다.", "3D")
}


# Precompute text embeddings
with torch.no_grad():
    encoded_prompts = {}
    for idx, sentences in PROMPTS_MAP.items():
        tokens = clip.tokenize(sentences).to(device)
        features = model.encode_text(tokens)
        features /= features.norm(dim=-1, keepdim=True)
        encoded_prompts[idx] = features.mean(dim=0) / features.mean(dim=0).norm()
    FINAL_TEXT_FEATURES = torch.stack([v for v in encoded_prompts.values()])

def run_clip_filter(image_path):
    try:
        image_pil = Image.open(image_path).convert("RGB")
        image_input = preprocess(image_pil).unsqueeze(0).to(device)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            similarity = (100.0 * image_features @ FINAL_TEXT_FEATURES.T).softmax(dim=-1)
            probs = similarity.cpu().numpy()[0]

        if probs[2] > 0.20:
            best_idx = 2
        else:
            best_idx = int(probs.argmax())

        verdict, reason, guide, label = RESULTS_INFO[best_idx]
        status = "accept" if best_idx == 5 else "reject"
        return {
            "status": status,
            "reason": reason,
            "guide": guide
        }
    except Exception as e:
        return {"status": "error", "reason": str(e)}


if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) != 2:
        print(json.dumps({"status": "error", "reason": "Usage: clip_filter.py <image_path>"}))
        sys.exit(1)
    image_path = sys.argv[1]
    result = run_clip_filter(image_path)
    print(json.dumps(result, ensure_ascii=False))