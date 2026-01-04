import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import Seo from '@/components/Seo'
import { LoadMoreButton } from '@/components/ActionButtons'
import LoadingSpinner from '@/components/LoadingSpinner'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

type Short = {
  id: string
  short_id: number
  content: string
  created_at: string
  related_links: string[]
}

type GroupedShorts = {
  dateLabel: string
  shorts: Short[]
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const LOAD_COUNT = 10

  // 1. 데이터 페칭 (마운트 시 1회 실행)
  useEffect(() => {
    async function fetchShorts() {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('shorts')
        .select('id, short_id, content, created_at, related_links')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (!data || error) {
        setIsLoading(false)
        return
      }

      setShorts(data)
      setIsLoading(false)
    }

    fetchShorts()
  }, [])

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

  const descriptionText = `280자 이내의 짧은 생각, 메모, 인용문 등을 씁니다. 언젠가 더 긴 글이 되기도 하겠죠.`

  const visibleItems = shorts.slice(0, visibleCount)

  const groupedShorts: GroupedShorts[] = []
  visibleItems.forEach((item) => {
    const dateLabel = format(new Date(item.created_at), 'yyyy.MM.dd. (E)')
    const lastGroup = groupedShorts[groupedShorts.length - 1]

    if (lastGroup && lastGroup.dateLabel === dateLabel) {
      lastGroup.shorts.push(item)
    } else {
      groupedShorts.push({ dateLabel, shorts: [item] })
    }
  })

  const today = new Date()
  const todayLabel = format(today, 'yyyy.MM.dd. (E)')
  const yesterdayLabel = format(subDays(today, 1), 'yyyy.MM.dd. (E)')
  const dayBeforeYesterdayLabel = format(subDays(today, 2), 'yyyy.MM.dd. (E)')

  // ✅ [수정] 그저께 이전 날짜도 포맷팅하여 표시
  const getDayLabel = (dateLabel: string) => {
    if (dateLabel === todayLabel) return '( Today )'
    if (dateLabel === yesterdayLabel) return '( Yesterday )'
    if (dateLabel === dayBeforeYesterdayLabel) return '( 2 Days Ago )'

    // "2025.03.22. (Wed)" -> "( 2025.03.22. Wed )" 변환
    return `( ${dateLabel.replace(/[()]/g, '')} )`
  }

  const hasTodayPosts = groupedShorts.length > 0 && getDayLabel(groupedShorts[0].dateLabel) === '( Today )'

  const ThinkingBubble = () => (
    <div
      className="flex items-end gap-2 group cursor-pointer"
      onClick={() => window.location.href = '/shorts'}
    >
      <div className="relative bg-gray-100 rounded-3xl px-5 py-3 text-gray-600 transition-colors duration-300 hover:bg-gray-200">
        <div className="flex items-center gap-1 h-6">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
        </div>

        <div className="absolute -left-2 bottom-3 w-4 h-4 rounded-full transition-colors duration-300 bg-inherit"></div>
        <div className="absolute -left-4 bottom-1 w-2 h-2 rounded-full transition-colors duration-300 bg-inherit"></div>
      </div>
      <div className="flex flex-col text-[10px] text-gray-300 mb-1 whitespace-nowrap font-mono leading-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span>Thinking...</span>
      </div>
    </div>
  )

  return (
    <>
      <Seo title="Shorts" description={descriptionText} />
      <article className="page-container">
        <h1 className="text-xl font-bold">Shorts</h1>
        <p className="mt-4 text-keepall text-gray-600">{descriptionText}</p>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="mt-8 space-y-8">
              {!hasTodayPosts && <ThinkingBubble />}

              {groupedShorts.map((group) => {
                const dayLabel = getDayLabel(group.dateLabel)
                const isToday = dayLabel === '( Today )'

                return (
                  <div key={group.dateLabel} className="pt-8 border-t border-gray-100 relative">
                    {/* ✅ dayLabel이 항상 존재하므로 모든 그룹에 라벨 표시됨 */}
                    {dayLabel && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#fcfcfc] px-2 text-xs text-gray-400 font-mono flex flex-col items-center gap-2 z-10">
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
                                  ? 'bg-[#0A84FF] text-white hover:bg-[#006DFF] rounded-2xl'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-3xl'
                                }
                              `}
                            >
                              <div className="markdown-content">
                                <ReactMarkdown
                                  allowedElements={['strong', 'em', 'a']}
                                  unwrapDisallowed={true}
                                  components={{
                                    a: ({ node, ...props }: any) => (
                                      <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                        }}
                                        className={`underline decoration-1 underline-offset-2 transition-colors ${isHighlighted
                                          ? 'text-white decoration-white/50 hover:decoration-white'
                                          : 'text-blue-500 decoration-blue-500/30 hover:decoration-blue-500'
                                          }`}
                                      />
                                    ),
                                  }}
                                >
                                  {item.content}
                                </ReactMarkdown>
                              </div>

                              {/* 하이라이트된 경우: 뾰족한 꼬리, 그 외: 동글동글한 꼬리 */}
                              {isHighlighted ? (
                                <div className="absolute -left-[8px] bottom-0 w-[20px] h-[20px] overflow-hidden">
                                  <svg
                                    viewBox="0 0 19 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-full h-full text-[#1888FE] group-hover/bubble:text-[#006DFF] transition-colors duration-500"
                                  ><path d="M-1.33514e-05 14.7395C9.10226 16.3944 16.0324 11.6364 18.3597 9.05055L18.1011 1.29294C15.6014 1.81011 10.1883 2.27557 8.53337 0C8.79195 9.30914 1.8101 13.9637 -1.33514e-05 14.7395Z" fill="currentColor" />
                                  </svg>
                                </div>
                              ) : (
                                <>
                                  <div className="absolute -left-2 bottom-3 w-4 h-4 rounded-full transition-colors duration-500 bg-inherit"></div>
                                  <div className="absolute -left-4 bottom-1 w-2 h-2 rounded-full transition-colors duration-500 bg-inherit"></div>
                                </>
                              )}

                              {item.related_links && item.related_links.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {item.related_links.map((link, i) => (
                                    <a
                                      key={i}
                                      href={link}
                                      target="_self"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`
                                        text-[11px] px-1.5 py-0.5 rounded transition-colors no-underline border
                                        ${isHighlighted
                                          ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                                          : 'bg-white/50 border-gray-200 text-gray-400 hover:text-gray-600'
                                        }
                                      `}
                                    >
                                      {item.related_links.length === 1 ? '연관 글' : `연관 글(${i + 1})`}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col text-[10px] text-gray-300 mb-1 whitespace-nowrap font-mono leading-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <span>
                                {format(new Date(item.created_at), 'yy.MM.dd.')}
                              </span>
                              <span>
                                {format(new Date(item.created_at), 'a h:mm')}
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
        )}
      </article>
    </>
  )
}