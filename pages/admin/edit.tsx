import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { supabase } from '@/supabase'
import { useOwner } from '@/components/admin/useOwner'

// react-md-editor는 window 의존 → SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

type SeriesRow = { id: string; series_name: string }

const empty = {
  title: '',
  subtitle: '',
  slug: '',
  content: '',
  series_id: '' as string, // '' = 없음
  is_published: false,
}

export default function AdminEdit() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const id = typeof router.query.id === 'string' ? router.query.id : null

  const [form, setForm] = useState({ ...empty })
  const [series, setSeries] = useState<SeriesRow[]>([])
  const [busy, setBusy] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)

  // 시리즈 목록
  useEffect(() => {
    if (!isOwner) return
    supabase
      .from('series')
      .select('id,series_name')
      .order('series_name')
      .then(({ data }) => setSeries(data ?? []))
  }, [isOwner])

  // 편집 대상 로드
  useEffect(() => {
    if (!isOwner || !id) return
    setLoadingPost(true)
    supabase
      .from('posts')
      .select('title,subtitle,slug,content,series_id,is_published')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data)
          setForm({
            title: data.title ?? '',
            subtitle: data.subtitle ?? '',
            slug: data.slug ?? '',
            content: data.content ?? '',
            series_id: data.series_id ?? '',
            is_published: !!data.is_published,
          })
        setLoadingPost(false)
      })
  }, [isOwner, id])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async (publish: boolean) => {
    if (!form.title.trim()) return toast.error('제목을 입력하세요.')
    if (!form.slug.trim()) return toast.error('slug(주소)를 입력하세요.')
    setBusy(true)
    const now = new Date().toISOString()
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      slug: form.slug.trim(),
      content: form.content,
      series_id: form.series_id || null,
      is_published: publish,
      updated_at: now,
    }

    let error
    if (id) {
      ;({ error } = await supabase.from('posts').update(payload).eq('id', id))
    } else {
      const newId = crypto.randomUUID()
      ;({ error } = await supabase
        .from('posts')
        .insert({ ...payload, id: newId, is_external: false, created_at: now }))
      if (!error) {
        // 새 글 → 편집 모드로 전환(이후 저장은 update)
        router.replace({ pathname: '/admin/edit', query: { id: newId } }, undefined, { shallow: true })
      }
    }

    setBusy(false)
    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else {
      set('is_published', publish)
      toast.success(publish ? '발행했습니다.' : '초안을 저장했습니다.')
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">확인 중…</div>
  if (!user || !isOwner)
    return (
      <div className="p-8 text-sm text-gray-500">
        접근 권한이 없습니다.{' '}
        <Link href="/admin" className="underline">
          로그인
        </Link>
      </div>
    )

  return (
    <>
      <Head>
        <title>{id ? '글 수정' : '새 글'} — Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">
            ← 목록
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => save(false)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              초안 저장
            </button>
            <button
              onClick={() => save(true)}
              disabled={busy}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              발행
            </button>
          </div>
        </div>

        {loadingPost ? (
          <p className="text-sm text-gray-400">불러오는 중…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="제목"
              className="w-full border-b border-gray-200 pb-2 text-2xl font-semibold outline-none placeholder:text-gray-300"
            />
            <input
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="부제 (선택)"
              className="w-full text-sm text-gray-600 outline-none placeholder:text-gray-300"
            />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <span className="text-gray-400">slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="url-address"
                  className="rounded border border-gray-200 px-2 py-1 font-mono text-xs outline-none focus:border-gray-400"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-gray-400">시리즈</span>
                <select
                  value={form.series_id}
                  onChange={(e) => set('series_id', e.target.value)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                >
                  <option value="">— 없음 —</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.series_name}
                    </option>
                  ))}
                </select>
              </label>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  form.is_published ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {form.is_published ? '발행됨' : '초안'}
              </span>
            </div>

            <div data-color-mode="light">
              <MDEditor
                value={form.content}
                onChange={(v) => set('content', v ?? '')}
                height={520}
                textareaProps={{ placeholder: '본문 (마크다운)' }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
