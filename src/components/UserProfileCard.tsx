'use client';

import { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/db';
import { profileService } from '@/services/archiveService';
import Link from 'next/link';

export default function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 5000)
      );
      
      const data = await Promise.race([
        profileService.getProfile(),
        timeoutPromise
      ]) as UserProfile | undefined;
      
      if (data) {
        setProfile(data);
        
        if (data.profileImageBlob) {
          const url = URL.createObjectURL(data.profileImageBlob);
          setProfileImageUrl(url);
        }
        
        if (data.backgroundImageBlob) {
          const url = URL.createObjectURL(data.backgroundImageBlob);
          setBackgroundImageUrl(url);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-500/5 overflow-hidden border border-white mb-10 group hover:-translate-y-1 transition-transform duration-300">
      
      {/* 커버 이미지 (배경) */}
      <div className="h-48 relative bg-slate-100 overflow-hidden">
        {backgroundImageUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-200" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
      </div>

      <div className="px-8 pb-8 relative">
        <div className="flex items-end justify-between -mt-16 mb-6">
          
          {/* 프로필 아바타 */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-lg bg-white overflow-hidden relative z-10 group-hover:shadow-xl transition-shadow">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                   <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 z-20 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>

          {/* 프로필 설정 버튼: 수정됨 (mb-4 제거, translate-y-2 추가) */}
          <Link
            href="/profile"
            className="translate-y-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>프로필 설정</span>
          </Link>
        </div>

        {/* 텍스트 정보 */}
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">
            {profile?.name || '익명의 큐레이터'}
          </h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            {profile?.bio || '나만의 3D 아카이브 일기장 ✨'}
          </p>
        </div>
      </div>
    </div>
  );
}