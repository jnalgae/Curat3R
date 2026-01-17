'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/archiveService';
import Link from 'next/link'; // 1. Link 컴포넌트 추가

export default function ProfilePage() {
  const router = useRouter();
  
  // Refs for triggering file inputs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  // File & Preview States
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      if (data) {
        setName(data.name);
        setBio(data.bio);
        
        if (data.profileImageBlob) {
          const url = URL.createObjectURL(data.profileImageBlob);
          setProfilePreview(url);
        }
        
        if (data.backgroundImageBlob) {
          const url = URL.createObjectURL(data.backgroundImageBlob);
          setBackgroundPreview(url);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackgroundImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const existingProfile = await profileService.getProfile();
      
      await profileService.saveProfile({
        name: name.trim(),
        bio: bio.trim(),
        profileImageBlob: profileImage || existingProfile?.profileImageBlob,
        backgroundImageBlob: backgroundImage || existingProfile?.backgroundImageBlob,
      });

      alert('✨ 프로필이 저장되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        {/* 로딩 스피너: 오렌지 -> 블루 변경 */}
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">프로필 불러오는 중...</p>
      </div>
    );
  }

  return (
    // 배경 및 선택 색상: 오렌지 -> 블루/스카이 변경
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Background Effect (홈 화면과 통일된 블루 톤) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          {/* 2. 로고에 홈 링크 적용 및 그라데이션 변경 (블루 계열) */}
          <Link href="/" className="relative inline-block hover:scale-105 transition-transform duration-300 cursor-pointer group">
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent mb-3 pb-1">
              Curat3R
            </h1>
            <span className="absolute -top-1 -right-5 text-2xl animate-pulse">⚙️</span>
          </Link>
          <p className="text-slate-600 text-lg font-medium">
            나만의 <span className="text-blue-600 font-bold">프로필</span>을 꾸며보세요
          </p>
        </div>

        {/* 카드 그림자: 오렌지 -> 블루 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/5 border border-white/50 overflow-hidden">
          
          <form onSubmit={handleSubmit}>
            {/* 1. 배경 이미지 (Cover Photo) */}
            <div className="relative h-48 md:h-64 bg-slate-100 group">
              {backgroundPreview ? (
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${backgroundPreview})` }}
                />
              ) : (
                // 기본 배경: 오렌지 -> 시원한 블루/시안 그라데이션
                <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center text-blue-300">
                  <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              
              {/* Cover Edit Overlay */}
              <div 
                onClick={() => backgroundInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
              >
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-semibold text-slate-700 shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  <span>배경 변경</span>
                </div>
              </div>
              <input 
                ref={backgroundInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleBackgroundImageChange} 
                className="hidden" 
              />
            </div>

            <div className="px-8 pb-8">
              {/* 2. 프로필 이미지 (Avatar) */}
              <div className="relative -mt-20 mb-8 inline-block group">
                <div className="w-36 h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white relative z-10">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  )}
                  
                  {/* Avatar Edit Overlay */}
                  <div 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
                
                {/* Camera Icon Badge */}
                <div className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-slate-100 text-slate-500 group-hover:opacity-0 transition-opacity z-20 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>

                <input 
                  ref={profileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileImageChange} 
                  className="hidden" 
                />
              </div>

              {/* 3. 텍스트 입력 폼 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="당신의 이름을 입력하세요"
                    // Focus Ring: 오렌지 -> 블루 변경
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    한줄 소개
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="자신을 소개하는 한 줄을 작성해보세요"
                    // Focus Ring: 오렌지 -> 블루 변경
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* 버튼 영역 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    // 저장 버튼: 오렌지 그라데이션 -> 블루/인디고 그라데이션
                    className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '💾 저장하기'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}