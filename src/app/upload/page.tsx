"use client";

import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { archiveService } from '@/services/archiveService';
import ThumbnailCreator from '@/components/ThumbnailCreator';
import AutoThumbnailGenerator from '@/components/AutoThumbnailGenerator';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Thumbnail States
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailBackgroundColor, setThumbnailBackgroundColor] = useState('#f5f5f5');
  const [showThumbnailCreator, setShowThumbnailCreator] = useState(false);
  const [useManualThumbnail, setUseManualThumbnail] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // -- Handlers --

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setThumbnailBlob(null);
    setUseManualThumbnail(false);
    setIsGeneratingThumbnail(false);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.name.toLowerCase().endsWith('.glb')) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      // GLB 파일이 선택되면 자동으로 썸네일 생성 시작
      setIsGeneratingThumbnail(true);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualThumbnail = () => {
    if (!preview || !file?.name.endsWith('.glb')) return;
    setShowThumbnailCreator(true);
  };

  const handleThumbnailCapture = (blob: Blob, bgColor: string) => {
    setThumbnailBlob(blob);
    setThumbnailBackgroundColor(bgColor);
    setUseManualThumbnail(true);
    setShowThumbnailCreator(false);
  };

  const handleSkipManualThumbnail = () => {
    setShowThumbnailCreator(false);
    setUseManualThumbnail(false);
    setIsGeneratingThumbnail(true);
  };

  const handleAutoThumbnailGenerated = (blob: Blob) => {
    setThumbnailBlob(blob);
    setIsGeneratingThumbnail(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      alert('파일과 제목을 모두 입력해주세요.');
      return;
    }

    if (file.name.toLowerCase().endsWith('.glb') && isGeneratingThumbnail) {
      alert('썸네일 생성 중입니다. 잠시만 기다려주세요.');
      return;
    }

    setLoading(true);

    try {
      const fileType = file.name.toLowerCase().endsWith('.glb') ? 'model' : 'image';

      await archiveService.addArchive({
        title: title.trim(),
        content: content.trim(),
        fileType,
        fileBlob: file,
        thumbnailBlob: fileType === 'model' ? thumbnailBlob || undefined : undefined,
      });

      alert('✨ 새로운 추억이 기록되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('Failed to save archive:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isGlb = file?.name.toLowerCase().endsWith('.glb');

  return (
    // 배경 및 선택 색상: 오렌지 -> 블루/스카이 변경
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Background Effect (홈 화면과 통일된 블루 톤) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          {/* 1. 로고 클릭 시 홈으로 이동 & 색상 변경 */}
          <Link href="/" className="relative inline-block hover:scale-105 transition-transform duration-300 cursor-pointer group">
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent mb-3 pb-1">
              Curat3R
            </h1>
            <span className="absolute -top-1 -right-5 text-2xl animate-pulse">📁</span>
          </Link>
          <p className="text-slate-600 text-lg font-medium">
            가지고 있는 <span className="text-blue-600 font-bold">파일</span>을 직접 업로드하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. File Upload Section */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-white/50">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   {/* 뱃지: 오렌지 -> 블루 */}
                   <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">1</span>
                   파일 선택
                </h2>
                {file && (
                   <button 
                      type="button" 
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setThumbnailBlob(null);
                      }}
                      className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                      disabled={loading}
                   >
                      초기화
                   </button>
                )}
             </div>

             {!preview ? (
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  // 드래그 박스: 주황색 점선 -> 블루 점선 & 호버 효과 변경
                  className="w-full h-64 border-3 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group bg-slate-50/50"
                >
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-3xl">📂</span>
                   </div>
                   <p className="text-slate-600 font-medium text-lg">파일을 드래그하거나 클릭하세요</p>
                   <p className="text-slate-400 text-sm mt-1">GLB(3D), PNG, JPG 지원</p>
                   <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".glb,.png,.jpg,.jpeg"
                      onChange={handleFileChange} 
                      className="hidden" 
                   />
                </div>
             ) : (
                <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner group">
                   {isGlb ? (
                     <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="font-medium text-slate-600">{file?.name}</p>
                        <p className="text-sm">3D 모델 파일이 로드되었습니다</p>
                     </div>
                   ) : (
                     <img src={preview} alt="Preview" className="w-full max-h-96 object-contain mx-auto" />
                   )}
                </div>
             )}
          </section>

          {/* 2. Thumbnail Section (GLB Only) */}
          {isGlb && preview && (
            <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-white/50 animate-fade-in-up">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                 <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">2</span>
                 썸네일 확인
              </h2>

              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Thumbnail Preview */}
                <div className="w-full md:w-1/3 aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden relative">
                   {thumbnailBlob ? (
                      <img src={URL.createObjectURL(thumbnailBlob)} alt="Thumbnail" className="w-full h-full object-cover" />
                   ) : (
                      <div className="text-center p-4">
                        {isGeneratingThumbnail ? (
                           <>
                              {/* 로딩 스피너: 오렌지 -> 블루 */}
                              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-slate-500 text-sm">자동 생성 중...</p>
                           </>
                        ) : (
                           <p className="text-slate-400 text-sm">썸네일을 만들어보세요</p>
                        )}
                      </div>
                   )}
                   
                   {/* Status Badge */}
                   {thumbnailBlob && (
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold ${useManualThumbnail ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                         {useManualThumbnail ? '수동 생성됨' : '자동 생성됨'}
                      </div>
                   )}
                </div>

                {/* Controls */}
                <div className="flex-1 w-full space-y-3">
                   <p className="text-slate-600 mb-2">
                      {thumbnailBlob 
                        ? '썸네일이 준비되었습니다. 마음에 들지 않으면 다시 만들 수 있어요.' 
                        : '자동으로 썸네일을 생성하거나, 직접 화면을 캡처해보세요.'}
                   </p>
                   
                   <button
                      type="button"
                      onClick={handleManualThumbnail}
                      // 버튼: 오렌지 -> 블루 테두리/배경
                      className="w-full py-3 bg-white border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                   >
                      <span>📸 썸네일 직접 만들기</span>
                   </button>
                </div>
              </div>
            </section>
          )}

          {/* 3. Details & Save */}
          {file && (
             <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-white/50 animate-fade-in-up">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                   <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">{isGlb ? 3 : 2}</span>
                   기록하기
                </h2>

                <div className="space-y-4 mb-8">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">제목</label>
                      <input
                         type="text"
                         value={title}
                         onChange={(e) => setTitle(e.target.value)}
                         placeholder="이 추억의 제목을 입력하세요"
                         // Focus Ring: 오렌지 -> 블루
                         className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                         required
                         disabled={loading}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">내용</label>
                      <textarea
                         value={content}
                         onChange={(e) => setContent(e.target.value)}
                         placeholder="오늘의 이야기를 자유롭게 적어보세요..."
                         rows={5}
                         // Focus Ring: 오렌지 -> 블루
                         className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                         disabled={loading}
                      />
                   </div>
                </div>

                <div className="flex gap-3">
                   <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                      disabled={loading}
                   >
                      취소
                   </button>
                   <button
                      type="submit"
                      disabled={loading || isGeneratingThumbnail}
                      // 저장 버튼: 오렌지 그라데이션 -> 블루/인디고 그라데이션
                      className="flex-[2] py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                      {loading ? '저장 중...' : '💾 저장하기'}
                   </button>
                </div>
             </section>
          )}

        </form>
      </div>

      {/* 썸네일 크리에이터 모달 */}
      {showThumbnailCreator && preview && (
        <ThumbnailCreator
          modelUrl={preview}
          onCapture={handleThumbnailCapture}
          onSkip={handleSkipManualThumbnail}
        />
      )}

      {/* 자동 썸네일 생성기 (Hidden) */}
      {preview && isGlb && isGeneratingThumbnail && (
        <AutoThumbnailGenerator
          modelUrl={preview}
          backgroundColor={thumbnailBackgroundColor}
          onThumbnailGenerated={handleAutoThumbnailGenerated}
        />
      )}
    </div>
  );
}