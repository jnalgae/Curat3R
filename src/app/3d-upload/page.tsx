import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md p-8 text-center">
        <h1 className="text-2xl font-extrabold mb-4">3D 모델 생성</h1>
        <p className="text-slate-500 mb-6">여기는 3D 모델 생성(placeholder) 페이지입니다. 업로드 폼이나 생성 워크플로우를 여기에 구현하세요.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">메인으로</Link>
        </div>
      </div>
    </div>
  );
}
