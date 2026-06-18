import { useState } from 'react'

interface PermissionGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function PermissionGuide({ isOpen, onClose }: PermissionGuideProps) {
  const [understood, setUnderstood] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
          ⚠️ Google Drive 권한 안내
        </h2>

        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            중요: 두 권한 모두 필수입니다!
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            하나라도 거부하면 "권한 부족" 오류가 발생합니다.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Google Drive의 앱 구성 데이터 확인, 생성, 삭제
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  기존에 저장된 플래너 데이터를 읽기 위해 필요
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  앱에서 사용하는 특정 Google Drive 파일에 한해 확인, 수정, 생성, 삭제
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  새로운 플래너 데이터를 저장하기 위해 필요
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            📋 로그인 과정:
          </h3>
          <ol className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
            <li>1. Google 로그인 클릭</li>
            <li>2. 계정 선택</li>
            <li>3. <strong className="text-red-600">두 체크박스 모두 체크 ✅</strong></li>
            <li>4. "계속" 버튼 클릭</li>
            <li>5. 로그인 완료</li>
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            ❓ 자주 묻는 질문:
          </h3>
          <div className="space-y-2">
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                왜 두 권한이 모두 필요한가요?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 pl-4">
                기존 사용자의 데이터는 숨김 폴더에, 새 데이터는 일반 폴더에 저장되어 
                두 위치 모두 접근이 필요합니다.
              </p>
            </details>
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                내 데이터는 안전한가요?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 pl-4">
                플래너는 오직 플래너가 생성한 파일만 접근할 수 있으며, 
                다른 Google Drive 파일은 볼 수 없습니다.
              </p>
            </details>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            두 권한 모두 허용해야 함을 이해했습니다
          </span>
        </label>

        <button
          onClick={onClose}
          disabled={!understood}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            understood
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          확인
        </button>
      </div>
    </div>
  )
}