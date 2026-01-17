'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Archive } from '@/lib/db';
import { archiveService } from '@/services/archiveService';
import ModelViewer from '@/components/ModelViewer';
import ImageViewer from '@/components/ImageViewer';
import Link from 'next/link';

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      const url = URL.createObjectURL(data.fileBlob);
      setFileUrl(url);
    } catch (error) {
      console.error('Failed to load archive:', error);
      alert('기록을 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!archive?.id) return;
    
    if (!confirm('정말로 이 기록을 삭제하시겠습니까? 복구할 수 없습니다.')) return;

    try {
      await archiveService.deleteArchive(archive.id);
      alert('기록이 삭제되었습니다.');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete archive:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        {/* 로딩 스피너: 오렌지 -> 블루 변경 */}
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">추억을 꺼내오는 중...</p>
      </div>
    );
  }

  if (!archive) return null;

  return (
    // 1. 전체 선택 색상: 오렌지 -> 블루 변경
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* 2. 배경 효과: 파란색과 사이언 계열 블러로 변경 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8 z-10">
        
        {/* 네비게이션 헤더 */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            // 뒤로가기 버튼 호버: 오렌지 -> 블루
            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-full hover:bg-white/50"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            일기장으로 돌아가기
          </button>

          <div className="flex gap-3">
            <Link
              href={`/edit/${archive.id}`}
              // 수정 버튼: 오렌지 -> 블루 변경
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              수정
            </Link>
            <button
              onClick={handleDelete}
              // 삭제 버튼: 붉은색 유지 (위험 행동이므로)
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          </div>
        </div>

        {/* 3. 뷰어 영역: 그림자를 블루 톤으로 변경 */}
        <div className="relative mb-6 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden group z-20">
            {/* 뷰어 배경 패턴: 슬레이트/블루 계열 미세 패턴 */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            
            <div className="relative z-10 min-h-[500px] flex items-center justify-center">
              {archive.fileType === 'image' ? (
                <div className="p-8 w-full h-full flex items-center justify-center">
                  <ImageViewer imageUrl={fileUrl} alt={archive.title} />
                </div>
              ) : (
                <ModelViewer modelUrl={fileUrl} />
              )}
            </div>
        </div>

        {/* 4. 정보 영역 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-white/50 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
              
              {/* 제목 및 날짜 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* 뱃지: 모델은 Cyan, 이미지는 Blue로 통일 */}
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    archive.fileType === 'model' 
                      ? 'bg-cyan-100 text-cyan-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {archive.fileType === 'model' ? '3D MODEL' : 'IMAGE'}
                  </span>
                  
                  {/* 날짜 표시 */}
                  <div className="flex items-center text-slate-400 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {new Date(archive.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                    })}
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2 tracking-tight">
                  {archive.title}
                </h1>

                {/* 수정일 */}
                {archive.updatedAt && archive.updatedAt !== archive.createdAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    (최종 수정: {new Date(archive.updatedAt).toLocaleDateString('ko-KR')})
                  </p>
                )}
              </div>
            </div>

            {/* 본문 내용 */}
            {archive.content ? (
              <div className="prose prose-lg prose-slate max-w-none">
                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                  {archive.content}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                작성된 내용이 없습니다.
              </div>
            )}
        </div>

      </div>
    </div>
  );
}