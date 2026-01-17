'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface Folder {
  id: number;
  name: string;
}

interface FolderSidebarProps {
  folders: Folder[];
  currentFolderId: number | null;
  onSelect: (id: number | null) => void;
  onAdd: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export default function FolderSidebar({
  folders,
  currentFolderId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: FolderSidebarProps) {
  // 인라인 편집 상태 관리
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 시작
  const startEditing = (folder: Folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  // 편집 저장
  const saveEditing = () => {
    if (editingId !== null && editName.trim() !== '') {
      onRename(editingId, editName);
    }
    setEditingId(null);
    setEditName('');
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  // 편집 모드 진입 시 자동 포커스
  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  return (
    <aside className="w-64 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 flex flex-col h-full max-h-[80vh]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-bold text-slate-700 text-lg flex items-center gap-2">
          <span>📁</span> 내 폴더
        </h2>
        <button
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
          onClick={onAdd}
          title="새 폴더 추가"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* 폴더 리스트 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <ul className="space-y-1">
          {/* 전체 보기 버튼 */}
          <li>
            <button
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2
                ${currentFolderId === null 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              onClick={() => onSelect(null)}
            >
              <span className="text-lg">🗂️</span>
              전체 보기
            </button>
          </li>

          <div className="my-2 border-t border-slate-100 mx-2" />

          {/* 개별 폴더 리스트 */}
          {folders.length === 0 ? (
            <li className="text-center py-8 text-slate-400 text-xs">
              <p>생성된 폴더가 없습니다</p>
            </li>
          ) : (
            folders.map((folder) => (
              <li 
                key={folder.id} 
                className={`group relative flex items-center rounded-xl transition-all duration-200
                  ${currentFolderId === folder.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}
                `}
              >
                <div className="flex-1 min-w-0 p-1">
                  {editingId === folder.id ? (
                    // 수정 모드 (Input)
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="w-full px-2 py-1.5 text-sm font-medium text-slate-900 bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
                      placeholder="폴더 이름 입력"
                    />
                  ) : (
                    // 일반 모드 (Button + Actions)
                    <div className="flex items-center justify-between w-full pl-2 pr-1 py-1.5">
                      <button
                        className={`text-left truncate text-sm font-medium transition-colors flex-1
                          ${currentFolderId === folder.id ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`}
                        onClick={() => onSelect(folder.id)}
                        title={folder.name}
                      >
                        {folder.name}
                      </button>

                      {/* 호버 시 나타나는 액션 버튼들 */}
                      <div className="hidden group-hover:flex items-center gap-1 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent pl-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(folder);
                          }}
                          className="p-1.5 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                          title="이름 변경"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`'${folder.name}' 폴더를 정말 삭제하시겠습니까?`)) {
                              onDelete(folder.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}