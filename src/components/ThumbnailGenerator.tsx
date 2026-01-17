'use client';

import { Canvas } from '@react-three/fiber';
import { Stage, useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ThumbnailGeneratorProps {
  modelUrl: string;
  onThumbnailGenerated: (blob: Blob) => void;
}

export default function ThumbnailGenerator({ modelUrl, onThumbnailGenerated }: ThumbnailGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 3초 후 썸네일 캡처
    const timer = setTimeout(() => {
      // ref를 통해 DOM 요소에 접근 (react-three-fiber 버전에 따라 접근 방식이 다를 수 있어 안전하게 처리)
      const canvas = canvasRef.current || document.querySelector('#thumbnail-canvas canvas');
      
      if (canvas instanceof HTMLCanvasElement) {
        canvas.toBlob((blob) => {
          if (blob) {
            onThumbnailGenerated(blob);
          }
        }, 'image/jpeg', 0.9); // 품질을 0.8 -> 0.9로 상향
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [modelUrl, onThumbnailGenerated]);

  return (
    <div className="fixed -left-[9999px] w-[400px] h-[400px]">
      <Canvas 
        id="thumbnail-canvas"
        ref={canvasRef as any} 
        camera={{ position: [0, 0, 5], fov: 45 }} // 구도를 살짝 줌인 (50 -> 45)
        gl={{ preserveDrawingBuffer: true, antialias: true }} // 캡처를 위해 버퍼 보존 필수
      >
        {/* 🌊 핵심 변경: 썸네일 배경색을 Ocean Blue 테마(Sky-50)로 설정 */}
        <color attach="background" args={['#f0f9ff']} />
        
        <Stage environment="city" intensity={0.6}>
          <Model url={modelUrl} />
        </Stage>
      </Canvas>
    </div>
  );
}