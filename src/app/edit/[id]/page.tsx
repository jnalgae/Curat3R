'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { archiveService } from '@/services/archiveService';
import { Archive } from '@/lib/db';

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArchive();
  }, [params.id]);

  const loadArchive = async () => {
    try {
      const id = Number(params.id);
      const data = await archiveService.getArchive(id);

      if (!data) {
        alert('기록을 찾을 수 없습니다.');
        router.push('/');
        return;
      }

      setArchive(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      console.error('Failed to load archive:', error);
      alert('기록을 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!archive?.id || !title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      await archiveService.updateArchive(archive.id, {
        title: title.trim(),
        content: content.trim(),
      });

      alert('✨ 일기가 수정되었습니다!');
      router.push(`/view/${archive.id}`);
    } catch (error) {
      console.error('Failed to update archive:', error);
      alert('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">기록을 불러오는 중...</p>
      </div>
    );
  }

  if (!archive) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-orange-200 selection:text-orange-900 pb-20">
      
      {/* Background Effect (통일된 배경) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-red-600 via-orange-500 to-rose-400 bg-clip-text text-transparent mb-3">
              Curat3R
            </h1>
            <span className="absolute -top-1 -right-5 text-2xl animate-pulse">✏️</span>
          </div>
          <p className="text-slate-600 text-lg font-medium">
            기록된 추억을 <span className="text-orange-600 font-bold">수정</span>합니다
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-orange-500/5 border border-white/50 overflow-hidden p-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. 파일 정보 (읽기 전용 카드) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                archive.fileType === 'model' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {archive.fileType === 'model' ? '📦' : '🖼️'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">
                  {archive.fileType === 'model' ? '3D 모델 파일' : '이미지 파일'}
                </p>
                <p className="text-xs text-slate-500">
                  첨부된 파일은 수정할 수 없습니다. 내용을 다듬어보세요.
                </p>
              </div>
            </div>

            {/* 2. 입력 폼 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 작성하세요..."
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* 3. 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/view/${archive.id}`)}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={saving}
              >
                {saving ? '저장 중...' : '✅ 수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}