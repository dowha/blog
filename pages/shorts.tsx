import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import type { GetStaticProps } from 'next'
import { fetchPageIntro, introToText } from '@/lib/pageIntro'
import Seo from '@/components/Seo'
import { useDeskShortcut } from '@/components/desk/useDeskShortcut'
import { LoadMoreButton } from '@/components/ActionButtons'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkMark from '@/lib/remarkMark'

type Short = {
  id: string
  short_id: number
  content: string
  created_at: string
  related_post_id: string | null
  related_post: {
    title: string
    slug: string
  } | null
  related_book_id: string | null
  related_book: {
    title: string
    slug: string
  } | null
}

type ShortResponse = {
  id: string
  short_id: number
  content: string
  created_at: string
  related_post_id: string | null
  related_post: {
    title: string
    slug: string
  }[] | null
  related_book_id: string | null
  related_book: {
    title: string
    slug: string
  }[] | null
}

type GroupedShorts = {
  dateLabel: string
  shorts: Short[]
}

type Props = { intro: string; shorts: Short[]; builtAt: number }

async function fetchShorts(): Promise<Short[]> {
  const { data, error } = await supabase
    .from('shorts')
    .select(`
      id,
      short_id,
      content,
      created_at,
      related_post_id,
      related_post:posts!related_post_id (
        title,
        slug
      ),
      related_book_id,
      related_book:books!related_book_id (
        title,
        slug
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (!data || error) {
    console.error('shorts fetch 오류:', error)
    return []
  }

  // DB 응답(배열 형태의 relation)을 단일 객체 형태로 변환
  return (data as ShortResponse[]).map((item) => ({
    ...item,
    related_post: (Array.isArray(item.related_post) ? item.related_post[0] : item.related_post) || null,
    related_book: (Array.isArray(item.related_book) ? item.related_book[0] : item.related_book) || null,
  }))
}

// 날짜 묶음은 방문자·서버 시간대와 상관없이 한국 시간 기준 ("2025.03.22. (토)")
const KST_PARTS = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})
function kstDateLabel(date: string | number) {
  const p = Object.fromEntries(KST_PARTS.formatToParts(new Date(date)).map((x) => [x.type, x.value]))
  return `${p.year}.${p.month}.${p.day}. (${p.weekday})`
}
const DAY = 24 * 60 * 60 * 1000

// 말풍선 옆 작성 시각 ("25.03.22.", "오후 3:05")
const KST_TIME = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
function kstTime(date: string) {
  const p = Object.fromEntries(KST_TIME.formatToParts(new Date(date)).map((x) => [x.type, x.value]))
  return { date: `${p.year}.${p.month}.${p.day}.`, time: `${p.dayPeriod} ${p.hour}:${p.minute}` }
}

// 목록 전체(공개 83개 기준 약 26kB)를 서버에서 넣어 60초마다 다시 만든다 (/desk 저장·삭제 시에는 즉시).
// 공유 링크(#번호)로 오래된 Shorts에 바로 갈 수 있도록 일부만 넣지 않는다
export const getStaticProps: GetStaticProps<Props> = async () => {
  const [intro, shorts] = await Promise.all([fetchPageIntro('shorts'), fetchShorts()])
  return { props: { intro, shorts, builtAt: Date.now() }, revalidate: 60 }
}

export default function ShortsPage({ intro, shorts, builtAt }: Props) {
  // 소유자 로그인 시 제목 더블클릭으로 /desk 진입
  const deskShortcut = useDeskShortcut('shorts')
  const [visibleCount, setVisibleCount] = useState(10)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  // '오늘' 판단 기준 시각: 첫 화면은 페이지를 만든 시각으로 그려 서버 HTML과 맞추고, 화면이 뜬 뒤 현재 시각으로 바꾼다
  const [now, setNow] = useState(builtAt)
  useEffect(() => setNow(Date.now()), [])

  const LOAD_COUNT = 10

  // 2. 해시 변경 감지 및 스크롤/하이라이팅 처리
  useEffect(() => {
    if (shorts.length === 0) return

    const handleHashChange = () => {
      // 1. 해시값 가져오기 (# 제거)
      const rawHash = window.location.hash.replace('#', '')

      // 2. [핵심] ? 뒤의 쿼리 파라미터가 붙어 있다면 제거하여 '순수 ID'만 추출
      // 예: '123?type=share' -> '123'
      // 예: '123' -> '123'
      // 이렇게 해야 뒤에 무엇이 붙든 상관없이 항상 ID 매칭이 성공합니다.
      const targetId = rawHash.split('?')[0]

      if (targetId) {
        // 데이터와 비교 (문자열 변환 등으로 안전하게 비교)
        const targetIndex = shorts.findIndex((item: Short) => String(item.short_id) === targetId)

        if (targetIndex !== -1) {
          if (targetIndex >= visibleCount) {
            setVisibleCount(targetIndex + 5)
          }

          setHighlightedId(targetId)

          setTimeout(() => {
            // ID로 요소 찾기 (여기서 순수 ID인 targetId가 들어가야 함)
            const element = document.getElementById(targetId)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 300)
        }
      } else {
        setHighlightedId(null)
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [shorts, visibleCount])

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_COUNT)
  }

  const handleCopyLink = async (shortId: number) => {
    const url = `${window.location.origin}/shorts#${shortId}?type=share`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('이 Shorts 링크가 복사되었습니다.')
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast.error('링크 복사에 실패했습니다.')
    }
  }

  const descriptionText = introToText(intro)

  const visibleItems = shorts.slice(0, visibleCount)

  const groupedShorts: GroupedShorts[] = []
  visibleItems.forEach((item) => {
    const dateLabel = kstDateLabel(item.created_at)
    const lastGroup = groupedShorts[groupedShorts.length - 1]

    if (lastGroup && lastGroup.dateLabel === dateLabel) {
      lastGroup.shorts.push(item)
    } else {
      groupedShorts.push({ dateLabel, shorts: [item] })
    }
  })

  const todayLabel = kstDateLabel(now)
  const yesterdayLabel = kstDateLabel(now - DAY)
  const dayBeforeYesterdayLabel = kstDateLabel(now - 2 * DAY)

  // 날짜 구분선: 최근 사흘은 오늘·어제·그저께, 그 이전은 "( 2025.03.22. 토 )" (blog 화면 문구는 국문)
  const getDayLabel = (dateLabel: string) => {
    if (dateLabel === todayLabel) return '( 오늘 )'
    if (dateLabel === yesterdayLabel) return '( 어제 )'
    if (dateLabel === dayBeforeYesterdayLabel) return '( 그저께 )'
    return `( ${dateLabel.replace(/[()]/g, '')} )`
  }

  const hasTodayPosts = groupedShorts.length > 0 && groupedShorts[0].dateLabel === todayLabel

  const ThinkingBubble = () => (
    <div
      className="flex items-end gap-2 group cursor-pointer"
      onClick={() => window.location.href = '/shorts'}
    >
      <div className="relative bg-gray-100 rounded-3xl px-5 py-3 text-gray-600 transition-colors hover:bg-gray-200">
        <div className="flex items-center gap-1 h-6">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
        </div>

        <div className="absolute -left-2 bottom-3 w-4 h-4 rounded-full transition-colors bg-inherit"></div>
        <div className="absolute -left-4 bottom-1 w-2 h-2 rounded-full transition-colors bg-inherit"></div>
      </div>
      <div className="flex flex-col text-[10px] text-gray-300 mb-1 whitespace-nowrap tabular-nums leading-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span>생각 중…</span>
      </div>
    </div>
  )

  return (
    <>
      <Seo title="Shorts" description={descriptionText} />
      <article className="page-container">
        <h1 {...deskShortcut}>
          Shorts
        </h1>
        <p className="mt-4 text-keepall text-gray-600" dangerouslySetInnerHTML={{ __html: intro }} />

        <>
            <div className="mt-8 space-y-8">
              {!hasTodayPosts && <ThinkingBubble />}

              {groupedShorts.map((group) => {
                const dayLabel = getDayLabel(group.dateLabel)
                const isToday = group.dateLabel === todayLabel

                return (
                  <div key={group.dateLabel} className="pt-8 border-t border-gray-100 relative">
                    {/* ✅ dayLabel이 항상 존재하므로 모든 그룹에 라벨 표시됨 */}
                    {dayLabel && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-page px-2 text-xs text-gray-400 tabular-nums flex flex-col items-center gap-2 z-10">
                        {dayLabel}
                      </div>
                    )}

                    <div className="mt-0 space-y-4">
                      {isToday && <ThinkingBubble />}

                      {group.shorts.map((item) => {
                        const isHighlighted = highlightedId === String(item.short_id)

                        return (
                          <div
                            key={item.id}
                            id={String(item.short_id)}
                            className="flex items-end gap-2 group"
                          >
                            <div
                              onClick={() => handleCopyLink(item.short_id)}
                              className={`
                                relative px-5 py-3 leading-relaxed max-w-[85%] whitespace-pre-wrap
                                transition-all duration-500 cursor-pointer group/bubble
                                ${isHighlighted
                                  ? 'bg-brand text-white hover:bg-brand-dark rounded-2xl'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-3xl'
                                }
                              `}
                            >
                              <div className="markdown-content">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMark]}
                                  allowedElements={['strong', 'em', 'mark']}
                                  unwrapDisallowed={true}
                                >
                                  {item.content.replace(/^(\s*)- /gm, '$1\\- ')}
                                </ReactMarkdown>
                              </div>

                              {/* 하이라이트된 경우: 뾰족한 꼬리, 그 외: 동글동글한 꼬리
                                  두 꼬리를 늘 그려 두고 투명도만 바꾼다. 하이라이트될 때 새로 그리면
                                  말풍선 바탕이 회색→파랑으로 바뀌는 동안 꼬리만 먼저 파랗게 보인다 */}
                              <div
                                aria-hidden
                                className={`absolute -left-[8px] bottom-0 w-[20px] h-[20px] overflow-hidden transition-opacity duration-500 ${isHighlighted ? 'opacity-100' : 'opacity-0'}`}
                              >
                                <svg
                                  viewBox="0 0 19 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-full h-full text-brand group-hover/bubble:text-brand-dark transition-colors duration-500"
                                ><path d="M-1.33514e-05 14.7395C9.10226 16.3944 16.0324 11.6364 18.3597 9.05055L18.1011 1.29294C15.6014 1.81011 10.1883 2.27557 8.53337 0C8.79195 9.30914 1.8101 13.9637 -1.33514e-05 14.7395Z" fill="currentColor" />
                                </svg>
                              </div>
                              <div aria-hidden className={`bg-inherit transition-opacity duration-500 ${isHighlighted ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="absolute -left-2 bottom-3 w-4 h-4 rounded-full transition-colors duration-500 bg-inherit"></div>
                                <div className="absolute -left-4 bottom-1 w-2 h-2 rounded-full transition-colors duration-500 bg-inherit"></div>
                              </div>

                              {(item.related_post || item.related_book) && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {item.related_post && (
                                    <a
                                      href={`/posts/${item.related_post.slug}`}
                                      target="_self"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`
                                        text-[11px] px-1.5 py-0.5 rounded transition-colors no-underline border flex items-center gap-1
                                        ${isHighlighted
                                          ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                                          : 'bg-white/50 border-gray-200 text-gray-500 hover:text-gray-700'
                                        }
                                      `}
                                    >
                                      <span className="opacity-70">Related:</span>
                                      <span className="font-medium">{item.related_post.title}</span>
                                    </a>
                                  )}
                                  {item.related_book && (
                                    <a
                                      href={`/books/${item.related_book.slug}`}
                                      target="_self"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`
                                        text-[11px] px-1.5 py-0.5 rounded transition-colors no-underline border flex items-center gap-1
                                        ${isHighlighted
                                          ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                                          : 'bg-white/50 border-gray-200 text-gray-500 hover:text-gray-700'
                                        }
                                      `}
                                    >
                                      <span className="opacity-70">Related:</span>
                                      <span className="font-medium">{item.related_book.title}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col text-[10px] text-gray-300 mb-1 whitespace-nowrap tabular-nums leading-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <span>
                                {kstTime(item.created_at).date}
                              </span>
                              <span>
                                {kstTime(item.created_at).time}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {shorts.length > visibleCount && (
              <div className="mt-8">
                <LoadMoreButton
                  loadMore={handleLoadMore}
                  hasMore={shorts.length > visibleCount}
                />
              </div>
            )}
        </>
      </article>
    </>
  )
}