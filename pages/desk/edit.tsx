import { useEffect, useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '@/supabase'
import { useOwner } from '@/components/desk/useOwner'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from '@/lib/upload'

// react-md-editor는 window 의존 → SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

type SeriesRow = { id: string; series_name: string }

// next.config.ts images.domains에 등록된 도메인만 렌더링 가능
const THUMB_DOMAINS = ['thumbnail.dowha.kim', 'images.dowha.kim']

const empty = {
  title: '',
  subtitle: '',
  slug: '',
  content: '',
  series_id: '' as string, // '' = 없음
  is_published: false,
  // books 전용
  author: '',
  publisher: '',
  publication_year: '',
  genre: '',
  thumbnail: '',
  is_reading: true,
}

export default function DeskEdit() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const id = typeof router.query.id === 'string' ? router.query.id : null

  // type=record → records, type=book → books. 기본은 posts(Writings).
  const isRecord = router.query.type === 'record'
  const isBook = router.query.type === 'book'
  const table = isRecord ? 'records' : isBook ? 'books' : 'posts'
  const label = isRecord ? '기록' : isBook ? '책' : '글'
  const typeQuery = isRecord ? { type: 'record' } : isBook ? { type: 'book' } : {}

  const [form, setForm] = useState({ ...empty })
  const [series, setSeries] = useState<SeriesRow[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)

  // 시리즈 목록은 posts에서만 필요
  useEffect(() => {
    if (!isOwner || isRecord || isBook) return
    supabase
      .from('series')
      .select('id,series_name')
      .order('series_name')
      .then(({ data }) => setSeries(data ?? []))
  }, [isOwner, isRecord, isBook])

  // 장르는 기존 books에서 수집해 입력 자동완성으로 제공
  useEffect(() => {
    if (!isOwner || !isBook) return
    supabase
      .from('books')
      .select('genre')
      .then(({ data }) =>
        setGenres(Array.from(new Set((data ?? []).map((b) => b.genre as string).filter(Boolean))))
      )
  }, [isOwner, isBook])

  useEffect(() => {
    if (!isOwner || !id) return
    setLoadingPost(true)
    const cols = isRecord
      ? 'title,slug,content,is_published'
      : isBook
        ? 'title,slug,content,author,publisher,publication_year,genre,thumbnail,is_reading'
        : 'title,subtitle,slug,content,series_id,is_published'
    supabase
      .from(table)
      .select(cols)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const d = data as unknown as Record<string, unknown> | null
        if (d)
          setForm({
            title: (d.title as string) ?? '',
            subtitle: (d.subtitle as string) ?? '',
            slug: (d.slug as string) ?? '',
            content: (d.content as string) ?? '',
            series_id: (d.series_id as string) ?? '',
            is_published: !!d.is_published,
            author: (d.author as string) ?? '',
            publisher: (d.publisher as string) ?? '',
            publication_year: d.publication_year == null ? '' : String(d.publication_year),
            genre: (d.genre as string) ?? '',
            thumbnail: (d.thumbnail as string) ?? '',
            is_reading: d.is_reading == null ? true : !!d.is_reading,
          })
        setLoadingPost(false)
      })
  }, [isOwner, id, table, isRecord, isBook])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  // 표지 업로드: 서버에서 서명 URL을 받아 브라우저가 스토리지로 직접 PUT한다.
  const uploadThumbnail = async (file: File) => {
    if (!form.slug.trim()) return toast.error('slug를 먼저 입력하세요. (파일명에 사용됩니다)')
    if (!ALLOWED_IMAGE_TYPES[file.type]) return toast.error('jpg·png·webp·avif만 올릴 수 있습니다.')
    if (file.size > MAX_UPLOAD_BYTES) return toast.error('이미지 크기는 5MB 이하여야 합니다.')

    setUploading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('세션이 만료되었습니다. 다시 로그인하세요.')

      const res = await fetch('/api/desk/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ slug: form.slug.trim(), contentType: file.type, size: file.size }),
      })
      const signed = await res.json()
      if (!res.ok) throw new Error(signed.error ?? '서명 발급에 실패했습니다.')

      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: signed.headers,
        body: file,
      })
      if (!put.ok) throw new Error(`스토리지 업로드 실패 (${put.status})`)

      set('thumbnail', signed.publicUrl)
      toast.success('표지를 업로드했습니다. 저장을 눌러 반영하세요.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const save = async (publish: boolean) => {
    if (!form.title.trim()) return toast.error('제목을 입력하세요.')
    if (!form.slug.trim()) return toast.error('slug(주소)를 입력하세요.')

    let payload: Record<string, unknown>
    if (isBook) {
      if (!form.author.trim()) return toast.error('저자를 입력하세요.')
      if (!form.genre.trim()) return toast.error('장르를 입력하세요.')
      const year = Number(form.publication_year)
      if (!Number.isInteger(year) || year < 1000 || year > 2100)
        return toast.error('출판연도를 4자리 숫자로 입력하세요.')
      payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        // 리뷰가 비면 null로 저장한다. books는 content가 null이면 상세/RSS에서 제외되는 규칙.
        content: form.content.trim() ? form.content : null,
        author: form.author.trim(),
        publisher: form.publisher.trim() || null,
        publication_year: year,
        genre: form.genre.trim(),
        thumbnail: form.thumbnail.trim() || null,
        is_reading: form.is_reading,
      }
    } else {
      // created_at/updated_at은 DB 기본값(now)·트리거(moddatetime)가 처리
      const base = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content,
        is_published: publish,
      }
      payload = isRecord
        ? base
        : { ...base, subtitle: form.subtitle.trim() || null, series_id: form.series_id || null }
    }

    setBusy(true)
    let error
    if (id) {
      ;({ error } = await supabase.from(table).update(payload).eq('id', id))
    } else if (isRecord || isBook) {
      // records/books: id·created_at는 DB 기본값 → 삽입 후 새 id 회수
      const res = await supabase.from(table).insert(payload).select('id').single()
      error = res.error
      if (!res.error && res.data) {
        router.replace(
          { pathname: '/desk/edit', query: { ...typeQuery, id: res.data.id } },
          undefined,
          { shallow: true }
        )
      }
    } else {
      const newId = crypto.randomUUID()
      ;({ error } = await supabase
        .from(table)
        .insert({ ...payload, id: newId, is_external: false }))
      if (!error) {
        router.replace({ pathname: '/desk/edit', query: { id: newId } }, undefined, { shallow: true })
      }
    }

    setBusy(false)
    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else if (isBook) {
      toast.success('저장했습니다.')
    } else {
      set('is_published', publish)
      toast.success(publish ? '발행했습니다.' : '초안을 저장했습니다.')
    }
  }

  const backToList = () =>
    router.push(
      isRecord
        ? { pathname: '/desk', query: { tab: 'records' } }
        : isBook
          ? { pathname: '/desk', query: { tab: 'books' } }
          : '/desk'
    )

  if (loading) return <p className="text-xs text-gray-400">확인 중…</p>
  if (!user || !isOwner)
    return (
      <div className="py-16 text-sm text-gray-500">
        접근 권한이 없습니다.{' '}
        <button onClick={() => router.push('/desk')} className="text-gray-700 underline underline-offset-2">
          로그인
        </button>
      </div>
    )

  // books는 발행 플래그가 없다. 리뷰(content) 유무가 곧 공개 여부.
  const bookPublic = !!form.content.trim()
  // next/image는 등록된 도메인만 처리하므로 그 경우에만 미리보기를 띄운다.
  const previewable = THUMB_DOMAINS.some((d) => form.thumbnail.startsWith(`https://${d}/`))

  return (
    <>
      <Head>
        <title>{`${id ? label + ' 수정' : '새 ' + label} | Dowha's Blog`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="page-container">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={backToList} className="text-xs text-gray-400 hover:text-gray-700">
            ← 목록
          </button>
          <div className="flex items-center gap-2">
            {isBook ? (
              <button
                onClick={() => save(false)}
                disabled={busy}
                className="default-button !mt-0 !bg-[#0a85d1] !text-white hover:!bg-[#0972b5] disabled:opacity-50"
              >
                저장
              </button>
            ) : (
              <>
                <button onClick={() => save(false)} disabled={busy} className="default-button !mt-0 disabled:opacity-50">
                  초안 저장
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={busy}
                  className="default-button !mt-0 !bg-[#0a85d1] !text-white hover:!bg-[#0972b5] disabled:opacity-50"
                >
                  발행
                </button>
              </>
            )}
          </div>
        </div>

        {loadingPost ? (
          <p className="text-xs text-gray-400">불러오는 중…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="제목"
              className="w-full border-b border-gray-200 pb-2 text-xl font-semibold text-gray-800 outline-none placeholder:text-gray-300"
            />
            {!isRecord && !isBook && (
              <input
                value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                placeholder="부제 (선택)"
                className="w-full text-sm text-gray-500 outline-none placeholder:text-gray-300"
              />
            )}

            {isBook && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <input
                  value={form.author}
                  onChange={(e) => set('author', e.target.value)}
                  placeholder="저자"
                  className="w-40 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                <input
                  value={form.publisher}
                  onChange={(e) => set('publisher', e.target.value)}
                  placeholder="출판사 (선택)"
                  className="w-40 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                <input
                  value={form.publication_year}
                  onChange={(e) => set('publication_year', e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="출판연도"
                  className="w-24 rounded border border-gray-200 px-2 py-1 font-mono text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                <input
                  value={form.genre}
                  onChange={(e) => set('genre', e.target.value)}
                  list="book-genres"
                  placeholder="장르"
                  className="w-32 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                <datalist id="book-genres">
                  {genres.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5">
                <span className="text-gray-400">slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="url-address"
                  className="rounded border border-gray-200 px-2 py-1 font-mono text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
              </label>
              {!isRecord && !isBook && (
                <label className="flex items-center gap-1.5">
                  <span className="text-gray-400">시리즈</span>
                  <select
                    value={form.series_id}
                    onChange={(e) => set('series_id', e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                  >
                    <option value="">— 없음 —</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.series_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {isBook && (
                <>
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">표지</span>
                    <input
                      value={form.thumbnail}
                      onChange={(e) => set('thumbnail', e.target.value)}
                      placeholder={`https://${THUMB_DOMAINS[0]}/…`}
                      title={`이미지 허용 도메인: ${THUMB_DOMAINS.join(', ')}`}
                      className="w-64 rounded border border-gray-200 px-2 py-1 font-mono text-[11px] text-gray-700 outline-none focus:border-gray-400"
                    />
                  </label>
                  {/* URL 직접 입력과 파일 업로드 중 아무거나 쓸 수 있다. */}
                  <label
                    className={`cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50 ${
                      uploading ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    {uploading ? '업로드 중…' : '업로드'}
                    <input
                      type="file"
                      accept={UPLOAD_ACCEPT}
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = '' // 같은 파일 재선택 허용
                        if (file) uploadThumbnail(file)
                      }}
                    />
                  </label>
                  {previewable && (
                    <Image
                      src={form.thumbnail}
                      alt="표지 미리보기"
                      width={32}
                      height={48}
                      className="h-12 w-8 rounded border border-gray-200 object-cover"
                      unoptimized
                    />
                  )}
                  <label className="flex items-center gap-1.5 text-gray-500">
                    <input
                      type="checkbox"
                      checked={form.is_reading}
                      onChange={(e) => set('is_reading', e.target.checked)}
                    />
                    <span>읽는 중</span>
                  </label>
                </>
              )}
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[11px] ${
                  (isBook ? bookPublic : form.is_published)
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
                title={isBook ? '리뷰(본문)가 있어야 상세 페이지가 공개됩니다.' : undefined}
              >
                {isBook ? (bookPublic ? '리뷰 공개' : '리뷰 없음') : form.is_published ? '발행됨' : '초안'}
              </span>
            </div>

            <div data-color-mode="light">
              <MDEditor
                value={form.content}
                onChange={(v) => set('content', v ?? '')}
                height={520}
                textareaProps={{ placeholder: isBook ? '리뷰 (마크다운, 비우면 비공개)' : '본문 (마크다운)' }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
