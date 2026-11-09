import { useEffect, useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '@/supabase'
import { useOwner } from '@/components/desk/useOwner'
import type { EmojiClickData, EmojiStyle } from 'emoji-picker-react'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from '@/lib/upload'
import { SHORTS_MAX_LENGTH, pureTextLength } from '@/lib/shorts'
import { notifyChanged } from '@/lib/indexnow'
import remarkMark from '@/lib/remarkMark'
import { normalizeQuotes } from '@/lib/styleCheck'
import StyleHints from '@/components/desk/StyleHints'
import SpellCheck from '@/components/desk/SpellCheck'
import ConfirmDialog from '@/components/desk/ConfirmDialog'

// react-md-editor는 window 의존 → SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
// 이모지 피커는 시리즈 편집에서만 쓰므로 별도 청크로 분리한다.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

type SeriesRow = { id: string; series_name: string }
// shorts의 연결 대상. ok=false면 상세 페이지가 없어 링크가 404가 된다.
type RelOption = { id: string; title: string; ok: boolean }

// next.config.ts images.domains에 등록된 도메인만 렌더링 가능
const THUMB_DOMAINS = ['thumbnail.dowha.kim', 'images.dowha.kim']

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
// DB CHECK(posts_external_url_scheme)와 같은 규칙
const HTTP_URL = /^https?:\/\//i
// '#' 없이 붙여넣어도 받아준다.
const normalizeHex = (v: string) => {
  const t = v.trim().toUpperCase()
  return t === '' || t.startsWith('#') ? t : `#${t}`
}

// timestamptz(ISO) → datetime-local 입력값. 브라우저 로컬 시간대 기준, 분 단위.
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const empty = {
  title: '',
  subtitle: '',
  slug: '',
  content: '',
  series_id: '' as string, // '' = 없음
  is_published: false,
  // posts(외부 글 제외)·books: 영어로 쓴 글·리뷰면 true → lang 'en' (목록 EN 배지, html lang)
  is_english: false,
  // books 전용
  author: '',
  publisher: '',
  publication_year: '',
  genre: '',
  thumbnail: '',
  is_reading: true,
  volumes: '', // 읽은 권수 범위 (예: 1~4권)
  // shorts 전용
  related_post_id: '',
  related_book_id: '',
  // 작성 시각(datetime-local). posts·books·shorts에서 사용. 새 항목에서 비우면 DB 기본값 now()
  created_at: '',
  // 외부 글(posts.is_external) 전용. 본문은 원문 사이트에 있고 링크·출처만 관리한다.
  is_external: false,
  external_url: '',
  source_name: '',
  // series 전용 (series_name은 title 칸을 그대로 쓴다)
  description: '',
  theme_color: '#FFFFFF',
  emoji: '',
}

export default function DeskEdit() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const id = typeof router.query.id === 'string' ? router.query.id : null

  // type=record → records, type=book → books, type=short → shorts. 기본은 posts(Writings).
  const isRecord = router.query.type === 'record'
  const isBook = router.query.type === 'book'
  const isShort = router.query.type === 'short'
  const isSeries = router.query.type === 'series'
  const isPost = !isRecord && !isBook && !isShort && !isSeries
  const table = isRecord
    ? 'records'
    : isBook
      ? 'books'
      : isShort
        ? 'shorts'
        : isSeries
          ? 'series'
          : 'posts'
  const label = isRecord ? '기록' : isBook ? '책' : isShort ? 'Shorts' : isSeries ? '시리즈' : '글'
  const typeQuery = isRecord
    ? { type: 'record' }
    : isBook
      ? { type: 'book' }
      : isShort
        ? { type: 'short' }
        : isSeries
          ? { type: 'series' }
          : {}

  const [form, setForm] = useState({ ...empty })
  // 외부 글은 기존 항목을 불러왔을 때만 판별된다. (새 글은 항상 내부 글로 만든다)
  const isExternal = isPost && !!id && form.is_external
  const [series, setSeries] = useState<SeriesRow[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [relPosts, setRelPosts] = useState<RelOption[]>([])
  const [relBooks, setRelBooks] = useState<RelOption[]>([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [customGenre, setCustomGenre] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  // 불러온 작성 시각. 바뀐 경우에만 저장해서 초 단위 값이 잘리지 않게 한다.
  const [origCreatedAt, setOrigCreatedAt] = useState('')
  // 저장 전 slug·공개 여부. 주소가 바뀌거나 비공개로 내릴 때 이전 주소도 검색엔진에 알리기 위해 기억한다.
  const [origSlug, setOrigSlug] = useState('')
  const [origPublic, setOrigPublic] = useState(false)
  const hasCreatedAt = isPost || isBook || isShort

  // 시리즈 목록은 posts에서만 필요
  useEffect(() => {
    if (!isOwner || isRecord || isBook || isShort || isSeries) return
    supabase
      .from('series')
      .select('id,series_name')
      .order('series_name')
      .then(({ data }) => setSeries(data ?? []))
  }, [isOwner, isRecord, isBook, isShort, isSeries])

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

  // shorts 연결 후보. 상세 페이지가 실제로 존재하는지(ok)까지 함께 계산한다.
  useEffect(() => {
    if (!isOwner || !isShort) return
    const load = async () => {
      const [posts, books, reviewed] = await Promise.all([
        supabase
          .from('posts')
          .select('id,title,is_external,is_published')
          .order('created_at', { ascending: false }),
        supabase.from('books').select('id,title').order('created_at', { ascending: false }),
        supabase.from('books').select('id').not('content', 'is', null),
      ])
      const reviewedIds = new Set((reviewed.data ?? []).map((b) => b.id as string))
      setRelPosts(
        (posts.data ?? []).map((r) => ({
          id: r.id as string,
          title: (r.title as string) ?? '(제목 없음)',
          // 외부 글은 /shorts의 배지가 /posts/[slug]로 나가 404가 되므로 제외한다.
          ok: !r.is_external && !!r.is_published,
        }))
      )
      setRelBooks(
        (books.data ?? []).map((r) => ({
          id: r.id as string,
          title: (r.title as string) ?? '(제목 없음)',
          ok: reviewedIds.has(r.id as string),
        }))
      )
    }
    load()
  }, [isOwner, isShort])

  useEffect(() => {
    if (!isOwner || !id) return
    setLoadingPost(true)
    const cols = isRecord
      ? 'title,slug,content,is_published'
      : isBook
        ? 'title,subtitle,slug,content,author,publisher,publication_year,genre,thumbnail,is_reading,created_at,lang,volumes'
        : isShort
          ? 'content,is_published,related_post_id,related_book_id,created_at'
          : isSeries
            ? 'title:series_name,slug,description,theme_color,emoji,is_published'
            : 'title,subtitle,slug,content,series_id,is_published,is_external,external_url,source_name,created_at,lang'
    supabase
      .from(table)
      .select(cols)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const d = data as unknown as Record<string, unknown> | null
        const created = toLocalInput(d?.created_at as string | null | undefined)
        setOrigCreatedAt(created)
        setOrigSlug((d?.slug as string) ?? '')
        setOrigPublic(isBook ? !!(d?.content as string | null)?.trim() : !!d?.is_published)
        if (d)
          setForm({
            title: (d.title as string) ?? '',
            subtitle: (d.subtitle as string) ?? '',
            slug: (d.slug as string) ?? '',
            content: (d.content as string) ?? '',
            series_id: (d.series_id as string) ?? '',
            is_published: !!d.is_published,
            is_english: d.lang === 'en',
            author: (d.author as string) ?? '',
            publisher: (d.publisher as string) ?? '',
            publication_year: d.publication_year == null ? '' : String(d.publication_year),
            genre: (d.genre as string) ?? '',
            thumbnail: (d.thumbnail as string) ?? '',
            is_reading: d.is_reading == null ? true : !!d.is_reading,
            volumes: (d.volumes as string) ?? '',
            created_at: created,
            related_post_id: (d.related_post_id as string) ?? '',
            related_book_id: (d.related_book_id as string) ?? '',
            description: (d.description as string) ?? '',
            theme_color: (d.theme_color as string) ?? '#FFFFFF',
            emoji: (d.emoji as string) ?? '',
            is_external: !!d.is_external,
            external_url: (d.external_url as string) ?? '',
            source_name: (d.source_name as string) ?? '',
          })
        setCustomGenre(false)
        setLoadingPost(false)
      })
  }, [isOwner, id, table, isRecord, isBook, isShort, isSeries])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!emojiOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setEmojiOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [emojiOpen])

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
        body: JSON.stringify({
          filename: file.name,
          slug: form.slug.trim(),
          contentType: file.type,
          size: file.size,
        }),
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
    if (isShort) {
      if (!form.content.trim()) return toast.error('내용을 입력하세요.')
      if (pureTextLength(form.content) > SHORTS_MAX_LENGTH)
        return toast.error(`${SHORTS_MAX_LENGTH}자를 넘을 수 없습니다.`)
    } else if (isExternal) {
      if (!form.title.trim()) return toast.error('제목을 입력하세요.')
      if (!HTTP_URL.test(form.external_url.trim()))
        return toast.error('원문 링크는 http:// 또는 https://로 시작해야 합니다.')
      if (!form.source_name.trim()) return toast.error('출처를 입력하세요.')
    } else {
      if (!form.title.trim())
        return toast.error(isSeries ? '시리즈 이름을 입력하세요.' : '제목을 입력하세요.')
      if (!form.slug.trim()) return toast.error('slug(주소)를 입력하세요.')
      // description은 NOT NULL이고, theme_color는 상세 페이지에서 '4D'를 이어붙여
      // 알파값을 만들기 때문에 반드시 #RRGGBB 7자리여야 한다.
      if (isSeries) {
        if (!form.description.trim()) return toast.error('설명을 입력하세요.')
        if (!HEX_COLOR.test(form.theme_color))
          return toast.error('테마 색상은 #RRGGBB 형식이어야 합니다.')
      }
    }

    let payload: Record<string, unknown>
    if (isExternal) {
      // 외부 글은 slug·본문·부제·시리즈를 쓰지 않으므로 건드리지 않는다.
      payload = {
        title: form.title.trim(),
        external_url: form.external_url.trim(),
        source_name: form.source_name.trim(),
        is_published: publish,
      }
    } else if (isSeries) {
      payload = {
        series_name: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        theme_color: form.theme_color,
        emoji: form.emoji.trim() || null,
        is_published: publish,
      }
    } else if (isShort) {
      // short_id는 set_short_id_trigger가 채번하므로 보내지 않는다.
      payload = {
        content: form.content,
        is_published: publish,
        related_post_id: form.related_post_id || null,
        related_book_id: form.related_book_id || null,
      }
    } else if (isBook) {
      if (!form.author.trim()) return toast.error('저자를 입력하세요.')
      if (!form.genre.trim()) return toast.error('장르를 입력하세요.')
      const year = Number(form.publication_year)
      if (!Number.isInteger(year) || year < 1000 || year > 2100)
        return toast.error('출판연도를 4자리 숫자로 입력하세요.')
      payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        slug: form.slug.trim(),
        // 리뷰가 비면 null로 저장한다. books는 content가 null이면 상세/RSS에서 제외되는 규칙.
        content: form.content.trim() ? form.content : null,
        author: form.author.trim(),
        publisher: form.publisher.trim() || null,
        publication_year: year,
        genre: form.genre.trim(),
        thumbnail: form.thumbnail.trim() || null,
        is_reading: form.is_reading,
        volumes: form.volumes.trim() || null,
        lang: form.is_english ? 'en' : 'ko',
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
        : {
            ...base,
            subtitle: form.subtitle.trim() || null,
            series_id: form.series_id || null,
            lang: form.is_english ? 'en' : 'ko',
          }
    }

    // 표기 규칙: 둥근 따옴표는 저장 전에 곧은 따옴표로 바꾼다
    for (const k of ['title', 'subtitle', 'series_name', 'description', 'content']) {
      const v = payload[k]
      if (typeof v === 'string') payload[k] = normalizeQuotes(v)
    }
    setForm((f) => ({
      ...f,
      title: normalizeQuotes(f.title),
      subtitle: normalizeQuotes(f.subtitle),
      description: normalizeQuotes(f.description),
      content: normalizeQuotes(f.content),
    }))

    // 작성 시각: 새 항목은 비우면 DB 기본값 now(), 기존 항목은 바뀌었을 때만 보낸다(비우면 기존 값 유지).
    if (hasCreatedAt) {
      if (form.created_at && form.created_at !== origCreatedAt) {
        const at = new Date(form.created_at)
        if (Number.isNaN(at.getTime())) return toast.error('작성 시각이 올바르지 않습니다.')
        payload.created_at = at.toISOString()
      }
    }

    setBusy(true)
    let error
    if (id) {
      ;({ error } = await supabase.from(table).update(payload).eq('id', id))
    } else if (isRecord || isBook || isShort || isSeries) {
      // records/books/shorts/series: id는 DB 기본값 → 삽입 후 새 id 회수
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
    if (!error) {
      // 공개 중이거나 방금 비공개로 내린 경우에만 페이지 재생성 + IndexNow 알림 (실패해도 저장에는 영향 없음)
      const nowPublic = isBook ? !!form.content.trim() : publish
      if (nowPublic || origPublic) {
        const slug = form.slug.trim()
        const detail = (base: string) =>
          [slug, origSlug].filter(Boolean).map((s) => `/${base}/${encodeURIComponent(s)}`)
        const paths = isExternal
          ? ['/writings', '/']
          : isPost
            ? [...detail('posts'), '/writings', '/']
            : isBook
              ? [...detail('books'), '/books']
              : isSeries
                ? [...detail('series'), '/series']
                : isShort
                  ? ['/shorts']
                  : ['/records']
        notifyChanged(paths)
      }
      setOrigSlug(form.slug.trim())
      setOrigPublic(isBook ? !!form.content.trim() : publish)
    }
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
          : isShort
            ? { pathname: '/desk', query: { tab: 'shorts' } }
            : isSeries
              ? { pathname: '/desk', query: { tab: 'series' } }
              : '/desk'
    )

  // 삭제는 저장된 상태 기준으로 초안(책은 리뷰 없음)만 허용한다. Shorts는 짧은 글이라 발행 후에도 허용.
  // 공개 주소가 갑자기 404가 되거나 검색엔진·RSS에 깨진 링크가 남는 것을 막기 위함.
  const canDelete = !!id && (isShort || !origPublic)
  const deleteName = isShort ? '이 Shorts' : `'${form.title.trim() || '제목 없음'}'`

  const remove = async () => {
    if (!id || !canDelete) return
    setDeleting(true)
    // select로 지워진 행을 돌려받아 RLS로 막혀 0건이 된 경우도 잡는다
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select(isBook ? 'id,thumbnail' : 'id')
    if (error || !data?.length) {
      setDeleting(false)
      if (error?.code === '23503')
        return toast.error('이 시리즈에 속한 글이 있어 삭제할 수 없습니다. 글의 시리즈를 먼저 빼 주세요.')
      return toast.error('삭제 실패: ' + (error?.message ?? '권한이 없거나 이미 삭제되었습니다.'))
    }

    // 책 표지: 업로드한 이미지면 버킷에서도 지운다 (실패해도 책 삭제는 끝난 상태)
    const thumb = isBook ? ((data[0] as { thumbnail?: string | null }).thumbnail ?? '') : ''
    if (thumb) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const res = await fetch('/api/desk/delete-thumbnail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ url: thumb }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      } catch (e) {
        toast.error('책은 삭제했지만 표지 이미지는 지우지 못했습니다. ' + (e instanceof Error ? e.message : ''))
      }
    }

    setDeleting(false)
    setDeleteOpen(false)
    toast.success('삭제했습니다.')
    backToList()
  }

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
  // shorts 길이는 DB CHECK와 같은 규칙으로 센다(마크다운 문법 제외).
  const shortLength = pureTextLength(form.content)
  const shortOver = isShort && shortLength > SHORTS_MAX_LENGTH
  const genreOptions =
    form.genre && !customGenre && !genres.includes(form.genre) ? [form.genre, ...genres] : genres
  const validColor = HEX_COLOR.test(form.theme_color)
  const brokenRel =
    (!!form.related_post_id && relPosts.some((o) => o.id === form.related_post_id && !o.ok)) ||
    (!!form.related_book_id && relBooks.some((o) => o.id === form.related_book_id && !o.ok))

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
                className="default-button !mt-0 !bg-[#0086FF] !text-white hover:!bg-[#006FD6] disabled:opacity-50"
              >
                저장
              </button>
            ) : (
              <>
                <button
                  onClick={() => save(false)}
                  disabled={busy || shortOver}
                  className="default-button !mt-0 disabled:opacity-50"
                >
                  초안 저장
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={busy || shortOver}
                  className="default-button !mt-0 !bg-[#0086FF] !text-white hover:!bg-[#006FD6] disabled:opacity-50"
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
            {!isShort && (
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder={isSeries ? '시리즈 이름' : '제목'}
                className="w-full border-b border-gray-200 pb-2 text-xl font-semibold text-gray-800 outline-none placeholder:text-gray-300"
              />
            )}
            {((isPost && !isExternal) || isBook) && (
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
                  className="w-24 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                <input
                  value={form.volumes}
                  onChange={(e) => set('volumes', e.target.value)}
                  placeholder="권수 (예: 1~4권)"
                  title="여러 권짜리를 읽었을 때만. 화면에 《제목》(1~4권)으로 붙습니다"
                  className="w-28 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                />
                {/* genre는 자유 text 컬럼이라 기존 목록에서 고르거나 새로 만들 수 있어야 한다 */}
                <select
                  value={customGenre ? '__custom__' : form.genre}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '__custom__') {
                      setCustomGenre(true)
                      set('genre', '')
                    } else {
                      setCustomGenre(false)
                      set('genre', v)
                    }
                  }}
                  className="w-32 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                >
                  <option value="">— 장르 —</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="__custom__">＋ 직접 입력</option>
                </select>
                {customGenre && (
                  <input
                    value={form.genre}
                    onChange={(e) => set('genre', e.target.value)}
                    placeholder="새 장르"
                    autoFocus
                    className="w-28 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                  />
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {isExternal && (
                <>
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">원문 링크</span>
                    <input
                      value={form.external_url}
                      onChange={(e) => set('external_url', e.target.value)}
                      placeholder="https://…"
                      className="w-72 rounded border border-gray-200 px-2 py-1 font-mono text-[11px] text-gray-700 outline-none focus:border-gray-400"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">출처</span>
                    <input
                      value={form.source_name}
                      onChange={(e) => set('source_name', e.target.value)}
                      placeholder="매체·사이트 이름"
                      className="w-40 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                    />
                  </label>
                  {HTTP_URL.test(form.external_url.trim()) && (
                    <a
                      href={form.external_url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700"
                    >
                      열어보기 ↗
                    </a>
                  )}
                </>
              )}
              {!isShort && !isExternal && (
                <label className="flex items-center gap-1.5">
                  <span className="text-gray-400">slug</span>
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="url-address"
                    className="rounded border border-gray-200 px-2 py-1 font-mono text-[11px] text-gray-700 outline-none focus:border-gray-400"
                  />
                </label>
              )}
              {isSeries && (
                <>
                  <div className="relative flex items-center gap-1.5">
                    <span className="text-gray-400">이모지</span>
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((v) => !v)}
                      className="flex h-6 w-9 items-center justify-center rounded border border-gray-200 text-sm hover:bg-gray-50"
                      aria-label="이모지 선택"
                    >
                      {form.emoji || <span className="text-[11px] text-gray-300">선택</span>}
                    </button>
                    {form.emoji && (
                      <button
                        type="button"
                        onClick={() => set('emoji', '')}
                        className="text-[11px] text-gray-400 hover:text-gray-600"
                      >
                        지우기
                      </button>
                    )}
                    {emojiOpen && (
                      <>
                        {/* 바깥 클릭으로 닫기 */}
                        <div className="fixed inset-0 z-40" onClick={() => setEmojiOpen(false)} />
                        <div className="desk-emoji-picker absolute left-0 top-8 z-50">
                          <EmojiPicker
                            onEmojiClick={(e: EmojiClickData) => {
                              set('emoji', e.emoji)
                              setEmojiOpen(false)
                            }}
                            // 이미지 스프라이트(jsdelivr) 대신 시스템 이모지 폰트를 쓴다
                            emojiStyle={'native' as EmojiStyle}
                            lazyLoadEmojis
                            skinTonesDisabled
                            width={264}
                            height={300}
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">테마 색상</span>
                    {/* 상세 페이지가 '4D'를 이어붙여 알파를 만들므로 #RRGGBB 7자리여야 한다.
                        피커와 직접 입력 중 아무거나 쓸 수 있다. */}
                    <input
                      type="color"
                      value={validColor ? form.theme_color : '#FFFFFF'}
                      onChange={(e) => set('theme_color', e.target.value.toUpperCase())}
                      className="h-6 w-10 cursor-pointer rounded border border-gray-200"
                    />
                    <input
                      value={form.theme_color}
                      onChange={(e) => set('theme_color', normalizeHex(e.target.value))}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      className={`w-[5.5rem] rounded border px-2 py-1 font-mono text-[11px] outline-none focus:border-gray-400 ${
                        validColor ? 'border-gray-200 text-gray-700' : 'border-[#f8c8b5] text-[#c8481c]'
                      }`}
                    />
                  </label>
                </>
              )}
              {isShort && (
                <>
                  {/* 후보는 상세 페이지가 실제로 있는 것만. 이미 걸려 있는 값은 깨졌더라도 유지한다. */}
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">관련 글</span>
                    <select
                      value={form.related_post_id}
                      onChange={(e) => set('related_post_id', e.target.value)}
                      className="max-w-[14rem] rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                    >
                      <option value="">— 없음 —</option>
                      {relPosts
                        .filter((o) => o.ok || o.id === form.related_post_id)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.ok ? o.title : `⚠︎ ${o.title}`}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="text-gray-400">관련 책</span>
                    <select
                      value={form.related_book_id}
                      onChange={(e) => set('related_book_id', e.target.value)}
                      className="max-w-[14rem] rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                    >
                      <option value="">— 없음 —</option>
                      {relBooks
                        .filter((o) => o.ok || o.id === form.related_book_id)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.ok ? o.title : `⚠︎ ${o.title}`}
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              )}
              {isPost && !isExternal && (
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
              {((isPost && !isExternal) || isBook) && (
                <label
                  className="flex items-center gap-1.5 text-gray-500"
                  title={isBook ? '리뷰를 영어로 썼으면 체크 (책 언어가 아님)' : '영어로 쓴 글이면 체크'}
                >
                  <input
                    type="checkbox"
                    checked={form.is_english}
                    onChange={(e) => set('is_english', e.target.checked)}
                  />
                  <span>{isBook ? '영어 리뷰' : '영어 글'}</span>
                </label>
              )}
              {hasCreatedAt && (
                <label className="flex items-center gap-1.5">
                  <span className="text-gray-400">작성 시각</span>
                  <input
                    type="datetime-local"
                    value={form.created_at}
                    onChange={(e) => set('created_at', e.target.value)}
                    title={id ? '목록 정렬과 날짜 표시에 쓰입니다' : '비우면 저장하는 시각으로 기록됩니다'}
                    className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-gray-400"
                  />
                </label>
              )}
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[11px] ${
                  (isBook ? bookPublic : form.is_published)
                    ? 'bg-[#eef6ff] text-[#006fd6]'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={isBook ? '리뷰(본문)가 있어야 상세 페이지가 공개됩니다.' : undefined}
              >
                {isBook ? (bookPublic ? '리뷰 공개' : '리뷰 없음') : form.is_published ? '발행됨' : '초안'}
              </span>
            </div>

            {brokenRel && (
              <p className="-mt-2 text-[11px] text-amber-600">
                ⚠︎ 표시된 항목은 공개된 상세 페이지가 없어 링크가 404가 됩니다.
              </p>
            )}

            {isExternal ? (
              <p className="text-[11px] text-gray-400">
                외부 글은 본문을 원문 사이트에서 보여줍니다. 목록에서는 원문 링크로 연결됩니다.
              </p>
            ) : isSeries ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="설명 (마크다운, 시리즈 페이지 상단에 표시됩니다)"
                  className="w-full resize-y rounded border border-gray-200 p-3 text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-300 focus:border-gray-400"
                />
              </div>
            ) : isShort ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={form.content}
                  onChange={(e) => set('content', e.target.value)}
                  rows={6}
                  placeholder="내용"
                  className="w-full resize-y rounded border border-gray-200 p-3 text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-300 focus:border-gray-400"
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">굵게(**), 기울임(*)만 화면에 표시됩니다</span>
                  <span className={shortOver ? 'font-medium text-[#c8481c]' : 'text-gray-400'}>
                    {shortLength} / {SHORTS_MAX_LENGTH}
                  </span>
                </div>
              </div>
            ) : (
              <div data-color-mode="light">
                <MDEditor
                  value={form.content}
                  onChange={(v) => set('content', v ?? '')}
                  height={520}
                  // 미리보기에서도 ==하이라이트== 표시
                  previewOptions={{ remarkPlugins: [remarkMark] }}
                  textareaProps={{
                    placeholder: isBook ? '리뷰 (마크다운, 비우면 비공개)' : '본문 (마크다운)',
                  }}
                />
              </div>
            )}

            {!isExternal && (
              <StyleHints
                fields={[
                  { label: '제목', text: isShort ? '' : form.title, headline: !isBook },
                  { label: '부제', text: isPost || isBook ? form.subtitle : '', headline: !isBook },
                  { label: '설명', text: isSeries ? form.description : '' },
                  { label: '본문', text: isSeries ? '' : form.content },
                ]}
              />
            )}

            {!isExternal && (
              <SpellCheck
                fields={[
                  { label: '제목', text: isShort ? '' : form.title },
                  { label: '부제', text: isPost || isBook ? form.subtitle : '' },
                  { label: '설명', text: isSeries ? form.description : '' },
                  { label: '본문', text: isSeries ? '' : form.content },
                ]}
              />
            )}

            {id && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-[11px]">
                <span className="text-gray-400">
                  {canDelete
                    ? '삭제하면 되돌릴 수 없습니다.'
                    : isBook
                      ? '리뷰가 공개된 책은 리뷰를 비우고 저장한 뒤 삭제할 수 있습니다.'
                      : '발행된 항목은 초안으로 저장한 뒤 삭제할 수 있습니다.'}
                </span>
                <button
                  onClick={() => setDeleteOpen(true)}
                  disabled={!canDelete}
                  className="shrink-0 rounded border border-[#f8c8b5] px-2 py-0.5 text-[#c8481c] transition-colors hover:bg-[#fef3ee] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  삭제
                </button>
              </div>
            )}

            <ConfirmDialog
              open={deleteOpen}
              message={`${deleteName}을(를) 삭제합니다.\n되돌릴 수 없습니다.`}
              confirmLabel="삭제"
              busyLabel="삭제 중…"
              busy={deleting}
              requireText="삭제"
              danger
              onConfirm={remove}
              onCancel={() => setDeleteOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  )
}
