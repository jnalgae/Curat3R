'use client';

import Link from 'next/link';
import { Archive } from '@/lib/db';
import { useEffect, useState } from 'react';

interface ArchiveCardProps {
  archive: Archive;
}

export default function ArchiveCard({ archive }: ArchiveCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (archive.fileType === 'image') {
      const url = URL.createObjectURL(archive.fileBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (archive.fileType === 'model' && archive.thumbnailBlob) {
      const url = URL.createObjectURL(archive.thumbnailBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [archive]);

  const isModel = archive.fileType === 'model';

  const getModelBadge = () => {
    const content = archive.content?.toLowerCase() || '';
    
    if (content.includes('trellis')) {
      return { 
        text: '고급모델', 
        style: 'bg-indigo-100/90 text-indigo-600 border-indigo-200' 
      };
    } else if (content.includes('stable') || content.includes('fast')) {
      return { 
        text: '일반모델', 
        style: 'bg-emerald-100/90 text-emerald-600 border-emerald-200' 
      };
    }
    return null;
  };

  const modelBadge = isModel ? getModelBadge() : null;

  return (
    <Link href={`/view/${archive.id}`} className="block h-full">
      <div className="group relative h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col">
        
        {/* 썸네일 영역 */}
        <div className="aspect-square relative overflow-hidden bg-slate-50">
          
          {modelBadge && (
            <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md border ${modelBadge.style}`}>
              {modelBadge.text}
            </div>
          )}

          <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md border ${
            isModel 
              ? 'bg-cyan-100/90 text-cyan-600 border-cyan-200' 
              : 'bg-blue-100/90 text-blue-600 border-blue-200'
          }`}>
            {isModel ? '3D' : 'IMG'}
          </div>

          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={archive.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200 ease-in-out"
            />
          ) : isModel ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-300 group-hover:text-blue-400 transition-colors">
              <svg className="w-16 h-16 mb-3 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-sm font-black opacity-70 tracking-widest">3D PREVIEW</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-900/5 transition-colors duration-300" />
        </div>
        
        {/* 정보 영역 */}
        <div className="p-5 flex flex-col flex-grow justify-between bg-white">
          <div>
            <h3 className="font-black text-slate-800 mb-1.5 truncate text-lg group-hover:text-blue-600 transition-colors">
              {archive.title}
            </h3>
            
            {/* ⭐️ [수정] 기본 문구 제거: 내용이 없으면 그냥 빈 문자열("") 출력 */}
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10 font-medium">
              {archive.content 
                ? archive.content.replace(/\[\s*Model\s*:.*?\]/gi, '').trim() 
                : "" 
              }
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
            <span>
              {new Date(archive.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {isModel && (
              <span className="flex items-center text-cyan-500 group-hover:text-cyan-600 transition-colors">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                VIEW 3D
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}