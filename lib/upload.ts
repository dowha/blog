/**
 * 표지 업로드 관련 공유 상수·타입.
 * 에디터(클라이언트)와 API 라우트가 함께 쓰므로 여기엔 서버 전용 의존성을 두지 않는다.
 * (lib/storage.ts는 aws-sdk를 import하므로 클라이언트에서 참조 금지)
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// 확장자는 서버가 MIME으로 결정한다(사용자 입력 파일명을 신뢰하지 않음).
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const UPLOAD_ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(',')

export type SignedUpload = {
  uploadUrl: string // 브라우저가 PUT할 서명된 URL (60초 유효)
  publicUrl: string // DB books.thumbnail에 저장할 최종 URL
  headers: Record<string, string> // PUT 시 그대로 전달해야 서명이 맞음
}
