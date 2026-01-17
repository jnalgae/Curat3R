'use client';

import { useState, useEffect } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
}

export default function ImageViewer({ imageUrl, alt }: ImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC 키로 전체화면 닫기 및 스크롤 제어
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  return (
    <>
      <div 
        className={`
          transition-all duration-500 ease-in-out
          ${isFullscreen 
            ? 'fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center backdrop-blur-xl' 
            // 1. 일반 배경: 회색에서 아주 연한 블루 톤(blue-50/50)으로 변경
            : 'relative w-full h-full bg-blue-50/30 rounded-[2.5rem] border border-blue-100/50 overflow-hidden group shadow-inner'
          }
        `}
      >
        <img
          src={imageUrl}
          alt={alt}
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`
            transition-all duration-500
            ${isFullscreen 
              ? 'w-full h-full p-8 cursor-zoom-out object-contain scale-100' 
              : 'w-full h-[500px] cursor-zoom-in object-contain hover:scale-105'
            }
          `}
        />
        
        {/* 2. 전체화면 토글 버튼: 테마 컬러(Blue/Cyan) 포인트 적용 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(!isFullscreen);
          }}
          className={`
            absolute transition-all duration-300
            ${isFullscreen 
              // 전체화면 시 버튼: 가독성을 위해 흰색 유지하되 호버 시 블루 포인트
              ? 'top-8 right-8 bg-white/10 text-white hover:bg-blue-500/20 hover:text-cyan-300 border border-white/10' 
              // 일반 모드 시 버튼: 텍스트를 진한 블루(blue-600)로 변경
              : 'top-6 right-6 bg-white/90 text-blue-600 shadow-lg shadow-blue-500/10 hover:bg-blue-50 hover:scale-110 opacity-0 group-hover:opacity-100'
            }
            p-3 rounded-2xl backdrop-blur-md
          `}
          title={isFullscreen ? '닫기 (ESC)' : '전체화면'}
        >
          {isFullscreen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        {/* 3. 하단 안내 텍스트 (옵션) */}
        {!isFullscreen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Click to Zoom</p>
          </div>
        )}
      </div>
    </>
  );
}