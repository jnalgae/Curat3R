import React, { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

export interface Folder {
  id: number;
  name: string;
}

interface FolderSidebarDnDProps {
  folders: Folder[];
  currentFolderId: number | null;
  onSelect: (id: number | null) => void;
  onAdd: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  isOpen: boolean; // 열림 상태 받기
}

export default function FolderSidebarDnD({
  folders,
  currentFolderId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  isOpen,
}: FolderSidebarDnDProps) {
  // 트리/리스트 토글 상태
  const [showTree, setShowTree] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (folder: Folder) => { setEditingId(folder.id); setEditName(folder.name); };
  const saveEditing = () => { if (editingId !== null && editName.trim()) onRename(editingId, editName); setEditingId(null); setEditName(''); };
  const cancelEditing = () => { setEditingId(null); setEditName(''); };

  useEffect(() => { if (editingId !== null && inputRef.current) inputRef.current.focus(); }, [editingId]);

  // 사이드바가 닫혀있으면 렌더링 최적화를 위해 내용 숨김 (선택사항)
  // if (!isOpen) return null; 

  return (
    <div className="h-full flex flex-col bg-white/50 backdrop-blur-xl border-r border-white/60 shadow-xl overflow-hidden">
      {/* 헤더 + 트리 토글 */}
      <div className="p-5 flex items-center justify-between min-w-[280px]">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-700 text-lg">📂 폴더 관리</h2>
          <button
            onClick={() => setShowTree((v) => !v)}
            className="ml-2 px-2 py-1 rounded text-xs font-bold border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all"
            title="디렉터리 구조 토글"
          >
            {showTree ? '리스트 보기' : '디렉터리 구조'}
          </button>
        </div>
        <button onClick={onAdd} className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" title="새 폴더">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* 리스트/트리 영역 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar min-w-[280px]">
        {/* 전체 보기 버튼 */}
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl font-bold transition-all duration-200
          ${currentFolderId === null 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-slate-600 hover:bg-white hover:shadow-md'}`}
          onClick={() => onSelect(null)}
        >
          <span>🗂️</span> 전체 파일 보기
        </button>

        <div className="text-xs font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">Folders</div>

        {showTree ? (
          // 트리 구조 (실제 하위 폴더가 없으므로, 예시로 2단계 트리 흉내)
          <ul className="pl-2">
            {folders.slice(0, Math.ceil(folders.length/2)).map((folder) => (
              <li key={folder.id} className="mb-1">
                <button onClick={() => onSelect(folder.id)} className={`text-left font-semibold ${currentFolderId === folder.id ? 'text-blue-600' : 'text-slate-600'}`}>{folder.name}</button>
                {/* 하위 폴더 예시 */}
                <ul className="pl-4 mt-1">
                  {folders.slice(Math.ceil(folders.length/2)).filter((_,i) => i%2===0).map((sub, i) => (
                    <li key={sub.id}>
                      <button onClick={() => onSelect(sub.id)} className={`text-left text-sm ${currentFolderId === sub.id ? 'text-blue-500' : 'text-slate-500'}`}>└ {sub.name}</button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <Droppable droppableId="folder-list" type="FOLDER">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                {folders.map((folder, idx) => (
                  <Draggable key={folder.id} draggableId={`folder-${folder.id}`} index={idx}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style }}>
                        {/* [Drop Zone] 파일 받기 */}
                        <Droppable droppableId={`folder-target-${folder.id}`} type="ARCHIVE">
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={`group relative flex items-center p-1 rounded-xl transition-all duration-200 border border-transparent
                                ${dropSnapshot.isDraggingOver 
                                  ? 'bg-blue-100 border-blue-400 scale-[1.02] shadow-lg z-10' 
                                  : snapshot.isDragging 
                                    ? 'bg-white shadow-2xl opacity-90' 
                                    : 'hover:bg-white hover:shadow-sm'
                                }
                                ${currentFolderId === folder.id && !dropSnapshot.isDraggingOver ? 'bg-white border-blue-200 shadow-sm' : ''}
                              `}
                            >
                              <div {...provided.dragHandleProps} className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                              </div>

                              <div className="flex-1 min-w-0 pr-2">
                                {editingId === folder.id ? (
                                  <input
                                    ref={inputRef}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={saveEditing}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                    className="w-full px-2 py-1 text-sm bg-slate-50 border border-blue-500 rounded focus:outline-none"
                                  />
                                ) : (
                                  <div className="flex justify-between items-center">
                                    <button onClick={() => onSelect(folder.id)} className={`text-left truncate text-sm font-semibold flex-1 py-2 ${currentFolderId === folder.id ? 'text-blue-600' : 'text-slate-600'}`}>
                                      {folder.name}
                                    </button>
                                    <div className="hidden group-hover:flex items-center gap-1">
                                      <button onClick={(e) => {e.stopPropagation(); startEditing(folder)}} className="p-1 hover:text-blue-600 text-slate-400">✏️</button>
                                      <button onClick={(e) => {e.stopPropagation(); if(confirm('삭제?')) onDelete(folder.id)}} className="p-1 hover:text-red-600 text-slate-400">🗑️</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="hidden">{dropProvided.placeholder}</div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
        {folders.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">폴더를 추가해보세요!</div>}
      </div>
    </div>
  );
}