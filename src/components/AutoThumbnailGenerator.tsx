'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Stage, useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/**
 * 📸 자동 캡처 모듈
 * 썸네일이 찍히는 찰나의 순간에도 Ocean Blue의 청량함을 담습니다.
 */
function AutoCapture({ 
  onThumbnailGenerated 
}: { 
  onThumbnailGenerated: (blob: Blob) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // 모델 로딩 및 렌더링 대기 시간을 넉넉히 주어 깨끗한 화면을 캡처합니다.
    const timer = setTimeout(() => {
      try {
        gl.render(scene, camera);
        
        // JPEG보다는 투명도나 선명도가 좋은 품질(0.9)로 추출합니다.
        gl.domElement.toBlob((blob) => {
          if (blob) {
            onThumbnailGenerated(blob);
          }
        }, 'image/jpeg', 0.9);
      } catch (error) {
        console.error('Auto thumbnail generation failed:', error);
      }
    }, 3500); // 렌더링 안정화를 위해 시간을 조금 더 늘렸습니다.

    return () => clearTimeout(timer);
  }, [gl, scene, camera, onThumbnailGenerated]);

  return null;
}

interface AutoThumbnailGeneratorProps {
  modelUrl: string;
  // 배경색을 선택적으로 받되, 기본값은 Ocean Blue 테마에 맞춥니다.
  backgroundColor?: string; 
  onThumbnailGenerated: (blob: Blob) => void;
}

export default function AutoThumbnailGenerator({ 
  modelUrl, 
  backgroundColor = '#f8fafc', // 기본 배경을 아주 밝은 블루 그레이(slate-50)로 설정
  onThumbnailGenerated 
}: AutoThumbnailGeneratorProps) {
  return (
    // 화면 밖으로 멀리 밀어내어 사용자에게는 보이지 않게 처리합니다.
    <div className="fixed -left-[9999px] w-[500px] h-[500px]" style={{ backgroundColor }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 4], fov: 45 }} // 조금 더 가깝고 선명하게 구도를 잡습니다.
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        {/* 🌊 썸네일 배경색: 메인 페이지 배경(slate-50)과 일치시켜 일체감을 줍니다. */}
        <color attach="background" args={[backgroundColor]} />
        
        {/* 조명을 'city'로 설정하여 금속이나 플라스틱 재질이 시원하게 반사되도록 합니다. */}
        <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.2, blur: 2 }}>
          <Model url={modelUrl} />
        </Stage>

        <AutoCapture 
          onThumbnailGenerated={onThumbnailGenerated} 
        />
      </Canvas>
    </div>
  );
}