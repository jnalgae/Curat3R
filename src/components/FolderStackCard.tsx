'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/dbClient'; // [!] db 경로가 '@/lib/db'라면 수정해주세요

interface FolderStackCardProps {
  folder: {
    id: number;
    name: string;
    // fileCount와 thumbnails는 내부에서 계산하므로 prop에서 제거하거나 선택사항으로 둡니다.
  };
  onClick?: () => void;
  onDelete?: (id: number) => void;
  onRename?: (id: number, name: string) => void;
}

export default function FolderStackCard({ folder, onClick, onDelete, onRename }: FolderStackCardProps) {
  // [수정 1] 부모에게서 받는 대신, 스스로 관리하는 상태값 추가
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [fileCount, setFileCount] = useState(0);

  // [수정 2] 폴더가 마운트되면 DB에서 직접 최신 데이터 가져오기
  useEffect(() => {
    let objectUrls: string[] = [];

    const loadFolderData = async () => {
      try {
        // 1. 파일 개수 세기
        const count = await db.archives.where('folderId').equals(folder.id).count();
        setFileCount(count);

        // 2. 최신 파일 3개 가져오기 (스택 썸네일용)
        const latestArchives = await db.archives
          .where('folderId')
          .equals(folder.id)
          .reverse() // 최신순
          .limit(3)
          .toArray();

        // 3. Blob -> URL 변환
        objectUrls = latestArchives
          .map(a => a.thumbnailBlob || a.fileBlob) // 썸네일 없으면 원본 사용
          .filter((blob): blob is Blob => !!blob)  // 빈 데이터 제외
          .map(blob => URL.createObjectURL(blob)); // URL 생성

        setThumbnails(objectUrls);

      } catch (error) {
        console.error("폴더 데이터 로딩 실패:", error);
      }
    };

    loadFolderData();

    // [수정 3] 메모리 누수 방지 (Cleanup)
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [folder.id]); // 폴더 ID가 바뀌면 다시 실행

  return (
    <div
      className="group relative h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* 썸네일 스택 */}
      <div className="relative w-full aspect-[1.4/1.6] flex items-end justify-center bg-slate-50">
        {thumbnails.length > 0 ? (
          <div className="flex w-full h-full items-end justify-center relative">
            {thumbnails.map((thumb, idx) => (
              <img
                key={idx}
                src={thumb}
                alt={`썸네일${idx + 1}`}
                // 보내주신 스택 디자인 클래스 그대로 유지
                className={`absolute left-1/2 top-0 w-[85%] h-[85%] object-cover rounded-2xl shadow-md border-2 border-white transition-all duration-300 ${
                  idx === 0 
                    ? '-translate-x-1/2 z-30' 
                    : idx === 1 
                      ? '-translate-x-[60%] z-20 scale-95 blur-[1px]' 
                      : 'translate-x-1/3 z-10 scale-90 blur-[2px]'
                }`}
                style={{
                  zIndex: 30 - idx,
                }}
              />
            ))}
          </div>
        ) : (
          // 이미지가 없을 때 (빈 폴더 아이콘)
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a4 4 0 018 0v2" />
            </svg>
          </div>
        )}
      </div>

      {/* 폴더 정보 박스 */}
      <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md px-5 py-4 flex flex-col items-start border-t border-slate-100 z-40">
        <div className="flex items-center w-full justify-between">
          <span className="font-black text-slate-800 text-lg truncate max-w-[70%]">
            {folder.name}
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {typeof onRename === 'function' && (
              <button
                className="text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 font-bold px-2 py-1 rounded transition"
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
                className="text-xs text-red-500 bg-red-50 hover:bg-red-100 font-bold px-2 py-1 rounded transition"
                onClick={e => { e.stopPropagation(); onDelete(folder.id); }}
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-400 mt-1 font-bold">
          {fileCount}개 파일
        </span>
      </div>
    </div>
  );
}