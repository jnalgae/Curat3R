'use client';

import Link from 'next/link';
import { Archive } from '@/lib/db';
import { useEffect, useState } from 'react';


// FolderStackCard Props
interface FolderStackCardProps {
  folder: {
    id: number;
    name: string;
    fileCount?: number;
    thumbnails?: string[];
  };
  onClick?: () => void;
  onDelete?: (id: number) => void;
  onRename?: (id: number, name: string) => void;
}

export default function FolderStackCard({ folder, onClick, onDelete, onRename }: FolderStackCardProps) {
  return (
    <div
      className="group relative h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* 썸네일 스택 */}
      <div className="relative w-full aspect-[1.4/1.6] flex items-end justify-center bg-slate-50">
        {folder.thumbnails && folder.thumbnails.length > 0 ? (
          <div className="flex w-full h-full items-end justify-center relative">
            {folder.thumbnails.map((thumb, idx) => (
              <img
                key={idx}
                src={thumb}
                alt={`썸네일${idx+1}`}
                className={`absolute left-1/2 top-0 w-[85%] h-[85%] object-cover rounded-2xl shadow-md border-2 border-white transition-all duration-300 ${
                  idx === 0 ? '-translate-x-1/2 z-30' : idx === 1 ? '-translate-x-[60%] z-20 scale-95 blur-[1px]' : 'translate-x-1/3 z-10 scale-90 blur-[2px]'
                }`}
                style={{
                  zIndex: 30 - idx,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a4 4 0 018 0v2" />
            </svg>
          </div>
        )}
      </div>
      {/* 폴더 정보 박스 */}
      <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md px-5 py-15 flex flex-col items-start border-t border-slate-100 z-40">
        <div className="flex items-center w-full justify-between">
          <span className="font-black text-slate-800 text-lg truncate max-w-[70%]">{folder.name}</span>
          <div className="flex items-center gap-2">
            {typeof onRename === 'function' && (
              <button
                className="ml-2 text-xs text-amber-600 hover:text-amber-700 font-bold px-2 py-1 rounded transition"
                onClick={e => {
                  e.stopPropagation();
                  const newName = window.prompt('새 폴더 이름을 입력하세요', folder.name);
                  if (newName && newName.trim()) onRename(folder.id, newName.trim());
                }}
              >
                수정
              </button>
            )}
            {typeof onDelete === 'function' && (
              <button
                className="ml-2 text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1 rounded transition"
                onClick={e => { e.stopPropagation(); onDelete(folder.id); }}
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-400 mt-1">{folder.fileCount ?? 0}개 파일</span>
      </div>
    </div>
  );
}