'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, useGLTF, useProgress } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { MOUSE } from 'three';

interface ModelProps {
  url: string;
  rotation: number;
}

function Model({ url, rotation }: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (modelRef.current) modelRef.current.rotation.z = rotation;
  }, [rotation]);
  return <group ref={modelRef}><primitive object={scene} /></group>;
}

function Loader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/30 backdrop-blur-md rounded-[2.5rem]">
      <div className="flex flex-col items-center justify-center bg-white/90 p-6 rounded-2xl shadow-2xl border border-blue-50 text-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p className="font-black text-sm text-blue-600">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

export default function ModelViewer({ modelUrl, backgroundColor = '#ffffff' }: { modelUrl: string; backgroundColor?: string }) {
  const [intensity, setIntensity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelRotation, setModelRotation] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // OrbitControls 제어를 위한 Ref
  const controlsRef = useRef<any>(null);
  const [isShiftDragging, setIsShiftDragging] = useState(false);
  const lastMouseXRef = useRef(0);

  useEffect(() => { setIsMounted(true); }, []);

  // Shift 키로 Pan 모드 전환
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && controlsRef.current) {
        controlsRef.current.mouseButtons.LEFT = MOUSE.PAN;
        document.body.style.cursor = 'move';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && controlsRef.current) {
        controlsRef.current.mouseButtons.LEFT = MOUSE.ROTATE;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // Z축 회전을 위한 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setIsShiftDragging(true);
      lastMouseXRef.current = e.clientX;
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isShiftDragging) {
      const deltaX = e.clientX - lastMouseXRef.current;
      setModelRotation((prev) => prev + deltaX * 0.01);
      lastMouseXRef.current = e.clientX;
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    if (isShiftDragging) {
      setIsShiftDragging(false);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  };

  const handleMouseLeave = () => {
    if (isShiftDragging) {
      setIsShiftDragging(false);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  };

  const viewerContent = (
    <div 
      className={`transition-all duration-500 ease-in-out flex items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen' : 'relative w-full h-full'
      }`}
      style={{ backgroundColor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <Loader />
      <div className="w-full h-full relative">
        <Canvas style={{ background: 'transparent' }} camera={{ position: [0, 0, 5], fov: 45 }} shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Environment preset="city" />
            <Stage intensity={intensity} adjustCamera shadows>
              <Model url={modelUrl} rotation={modelRotation} />
            </Stage>
            <OrbitControls ref={controlsRef} enablePan={true} makeDefault />
          </Suspense>
        </Canvas>
      </div>
      
      {/* 🔷 상단 UI: Curat3R 오리지널 디자인 (화이트 배경 + 블루 텍스트) */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-[100] pointer-events-none">
        
        {/* 조작 가이드 */}
        <div className={`backdrop-blur-md px-5 py-3 rounded-2xl border text-[12px] font-bold shadow-lg transition-all tracking-wide ${
          isFullscreen 
            ? 'bg-white/90 border-blue-100 text-blue-600 shadow-blue-200/20' // ✅ 전체화면: 더 선명한 화이트 & 블루
            : 'bg-white/80 border-white/60 text-blue-600 shadow-blue-500/5'
        }`}>
          회전: 드래그 &nbsp;|&nbsp; 줌: 스크롤 &nbsp;|&nbsp; 이동: Ctrl+드래그 &nbsp;|&nbsp; Z축이동: Shift+드래그
        </div>

        {/* 전체 화면/닫기 버튼 */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`p-3.5 rounded-full backdrop-blur-md shadow-xl border transition-all pointer-events-auto hover:scale-105 active:scale-95 group ${
            isFullscreen 
              ? 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200' 
              : 'bg-white/90 border-white/60 text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isFullscreen ? (
            <svg className="w-6 h-6 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          )}
        </button>
      </div>

      {/* 🔷 하단 UI: 밝기 조절 슬라이더 */}
      <div className={`absolute bottom-8 right-8 backdrop-blur-md px-5 py-4 rounded-3xl shadow-xl border flex items-center gap-4 transition-all z-[100] ${
        isFullscreen 
          ? 'bg-white/90 border-blue-100 text-blue-600 shadow-blue-200/20' 
          : 'bg-white/90 border-blue-100/50 text-blue-700 shadow-blue-500/10'
      }`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        <input
          type="range" min="0.2" max="2.5" step="0.1"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-28 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 accent-blue-600 hover:accent-blue-700"
        />
      </div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <div className="relative w-full h-[540px] rounded-[2.5rem] overflow-hidden border border-blue-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
      {isFullscreen ? createPortal(viewerContent, document.body) : viewerContent}
    </div>
  );
}