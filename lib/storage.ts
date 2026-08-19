import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ALLOWED_IMAGE_TYPES, type SignedUpload } from '@/lib/upload'

/**
 * 책 표지 업로드용 스토리지 어댑터 (현재 구현: Cloudflare R2).
 *
 * 업로드 방식은 "서버가 서명한 URL에 브라우저가 직접 PUT"으로 고정한다.
 * Vercel의 요청 바디 제한(4.5MB)을 피할 수 있고, Supabase Storage의
 * createSignedUploadUrl도 동일한 모양(서명 URL + PUT)이라 나중에 이관할 때
 * 이 파일만 교체하면 API 라우트와 에디터 UI는 그대로 쓸 수 있다.
 */

const env = (key: string) => {
  const v = process.env[key]
  if (!v) throw new Error(`스토리지 환경 변수 ${key}가 설정되지 않았습니다.`)
  return v
}

const client = () =>
  new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    },
    // R2는 aws-chunked/체크섬 헤더를 지원하지 않는다. SDK v3 기본값(WHEN_SUPPORTED)을
    // 그대로 두면 서명에 x-amz-checksum-*가 포함돼 presigned PUT이 실패한다.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

/**
 * 업로드한 파일명을 그대로 키로 쓴다(버킷 루트에 <파일명>.<ext>).
 * 파일명은 클라이언트가 준 값이므로 경로 구분자를 떼고 안전한 문자만 남긴다.
 * 확장자는 파일명이 아니라 MIME에서 결정한다(jpeg → jpg로 정규화됨).
 * 이름이 같으면 기존 객체를 덮어쓴다.
 */
export const buildKey = (filename: string, slug: string, ext: string) => {
  const base = (filename.split(/[\\/]/).pop() ?? '').replace(/\.[^.]*$/, '') // 경로·확장자 제거
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '')
    .slice(0, 100)
  const fallback = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${safe || fallback || 'book'}.${ext}`
}

export async function createThumbnailUpload({
  filename,
  slug,
  contentType,
}: {
  filename: string
  slug: string
  contentType: string
}): Promise<SignedUpload> {
  const ext = ALLOWED_IMAGE_TYPES[contentType]
  if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.')

  const key = buildKey(filename, slug, ext)
  const uploadUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: env('R2_BUCKET'),
      Key: key,
      ContentType: contentType,
      // 같은 파일명으로 덮어쓸 수 있으므로 immutable은 쓰지 않는다
      CacheControl: 'public, max-age=3600',
    }),
    { expiresIn: 60 }
  )

  return {
    uploadUrl,
    publicUrl: `${env('R2_PUBLIC_BASE').replace(/\/$/, '')}/${key}`,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
  }
}
