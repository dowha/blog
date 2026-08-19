import { randomBytes } from 'crypto'
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

// slug 기반 키 + 임의 접미사. 표지를 교체해도 키가 달라져 CDN 캐시에 옛 이미지가 남지 않는다.
export const buildKey = (slug: string, ext: string) => {
  const base = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${base || 'book'}-${randomBytes(3).toString('hex')}.${ext}`
}

export async function createThumbnailUpload({
  slug,
  contentType,
}: {
  slug: string
  contentType: string
}): Promise<SignedUpload> {
  const ext = ALLOWED_IMAGE_TYPES[contentType]
  if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.')

  const key = buildKey(slug, ext)
  const uploadUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: env('R2_BUCKET'),
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: 60 }
  )

  return {
    uploadUrl,
    publicUrl: `${env('R2_PUBLIC_BASE').replace(/\/$/, '')}/${key}`,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
  }
}
