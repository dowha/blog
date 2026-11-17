import React, { FC, HTMLAttributes } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import type { Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkMark from '@/lib/remarkMark'
import rehypeEndmark from '@/lib/rehypeEndmark'
import Image from 'next/image'
import { ComponentProps } from 'react'
import QuoteFont, { hasBlockquote } from '@/components/QuoteFont'

// ① react-markdown이 사용하는 기본 Components를 확장
interface ExtendedComponents extends Components {
  // date라는 태그가 span으로 렌더링될 것이므로, HTMLSpanElement 속성을 받을 수 있도록 타입 지정
  date?: FC<HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }>
}

// node 속성 필터링 유틸리티 함수
const filterProps = <T extends Record<string, unknown>>(
  props: T
): Omit<T, 'node'> => {
  const result = { ...props } // 얕은 복사
  delete (result as { node?: unknown }).node
  return result
}

// ③ 커스텀 렌더러(ExtendedComponents 타입 사용)
const customComponents: ExtendedComponents = {
  a: ({ href = '', children, ...props }) => {
    // 사이트 안 경로(/)와 같은 문서 안 이동(#, 각주)은 같은 탭에서 연다
    const isInternalLink = href.startsWith('/') || href.startsWith('#')
    const filteredProps = filterProps(props)
    return (
      <a
        href={href}
        {...filteredProps}
        target={isInternalLink ? undefined : '_blank'}
        rel={isInternalLink ? undefined : 'noopener'}
      >
        {children}
      </a>
    )
  },

  p: ({ children }) => {
    const childrenArray = React.Children.toArray(children)

    // 기존 블록 요소 검사 로직
    const hasBlockElements = childrenArray.some((child) => {
      if (React.isValidElement(child) && typeof child.type === 'string') {
        return ['div', 'iframe', 'figure'].includes(child.type)
      }
      return false
    })

    if (hasBlockElements) {
      return <>{children}</>
    }

    return <p>{children}</p>
  },

  img: ({ src = '', alt = '이미지' }) => {
    // react-markdown의 src 타입이 string | Blob이므로, next/image를 위해 string으로 변환
    const imageSrc = typeof src === 'string' ? src : ''
    if (!imageSrc) return null

    return (
      <div className="flex justify-center my-4">
        <Image
          src={imageSrc}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto max-w-[800px] rounded-lg"
        />
      </div>
    )
  },

  iframe: ({ style, ...props }: ComponentProps<'iframe'>) => {
    // 허용한 서비스(유튜브·애플 뮤직)의 임베드만 그린다
    if (!isAllowedEmbed(props.src)) return null
    const filteredProps = filterProps(props)
    return (
      <div className="mt-6 w-full mx-auto">
        <iframe
          {...filteredProps}
          style={{
            width: '100%',
            maxWidth: '660px',
            overflow: 'hidden',
            borderRadius: '10px',
            ...style,
          }}
          scrolling="no"
        />
      </div>
    )
  },

  code: ({ className, children, ...props }: ComponentProps<'code'>) => {
    // ✅ 블록 코드인지 확인 (className이 있거나, 여러 줄이면 블록 코드)
    const isBlock = className || String(children).includes('\n')
    const filteredProps = filterProps(props)

    if (!isBlock) {
      return (
        <code
          className="bg-gray-100 text-brand px-1 py-0.5 rounded whitespace-nowrap"
          {...filteredProps}
        >
          {children}
        </code>
      )
    }

    return (
      <pre className="bg-gray-900 text-white mt-6 text-sm p-4 rounded-lg overflow-auto">
        <code className={className} {...filteredProps}>
          {Array.isArray(children)
            ? children.join('')
            : String(children).trim()}
        </code>
      </pre>
    )
  },

  // ④ date 태그 커스텀 렌더러
  date: ({ children, ...props }) => {
    const filteredProps = filterProps(props)
    return (
      <span className="tabular-nums text-xs" {...filteredProps}>
        {children}
      </span>
    )
  },
}

// 본문 iframe으로 허용하는 주소(https만)
const EMBED_HOSTS = new Set(['www.youtube.com', 'www.youtube-nocookie.com', 'embed.music.apple.com'])
const isAllowedEmbed = (src: unknown) => {
  if (typeof src !== 'string') return false
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && EMBED_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

// 본문 HTML 허용 목록 (DO-74). GitHub 기준 기본값에 이 블로그가 쓰는 태그만 더한다
// - date: records 날짜 표기, mark: ==형광펜==, iframe: 유튜브·애플 뮤직 임베드
// - script·이벤트 속성(onclick 등)·style·javascript: 링크는 모두 제거된다
// - 각주 id는 remark가 이미 'user-content-'를 붙이므로 여기서는 접두어를 다시 붙이지 않는다
const SANITIZE_SCHEMA = {
  ...defaultSchema,
  clobberPrefix: '',
  tagNames: [...(defaultSchema.tagNames ?? []), 'date', 'mark', 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowFullScreen', 'frameBorder', 'referrerPolicy', 'sandbox', 'loading'],
  },
}

// 각주: 하단 제목은 화면에서 숨기고(sr-only) 읽기 프로그램용 문구만 한국어로
const REMARK_REHYPE_OPTIONS: Options['remarkRehypeOptions'] = {
  footnoteLabel: '각주',
  footnoteBackLabel: (i: number) => `본문 ${i + 1}번 각주 위치로 돌아가기`,
}

// 취소선은 쓰지 않는다. remark-gfm은 기본으로 ~하나~도 취소선으로 읽어서
// '1~4권, 2015~16년'처럼 한 줄에 물결표가 두 번 나오면 사이가 지워진 것처럼 보인다.
// singleTilde를 끄고, ~~두 개~~로 쓴 것도 취소선 없이 글자만 남긴다.
const GFM_PLUGINS: Options['remarkPlugins'] = [[remarkGfm, { singleTilde: false }], remarkMark]
const NO_STRIKE = ['del']

// ⑤ MarkdownContent 컴포넌트에서 확장된 customComponents 사용
// endmark: 글 끝에 엔드마크(파란 동그라미)를 붙인다. writings·books 본문에서만 사용
const MarkdownContent = ({ content, endmark = false }: { content: string; endmark?: boolean }) => (
  <>
    {/* 인용구가 있을 때만 인용구 글꼴을 불러온다 */}
    {hasBlockquote(content) && <QuoteFont />}
    <ReactMarkdown
      remarkPlugins={GFM_PLUGINS}
      disallowedElements={NO_STRIKE}
      unwrapDisallowed
      remarkRehypeOptions={REMARK_REHYPE_OPTIONS}
      rehypePlugins={
        endmark
          ? [rehypeRaw, [rehypeSanitize, SANITIZE_SCHEMA], rehypeEndmark]
          : [rehypeRaw, [rehypeSanitize, SANITIZE_SCHEMA]]
      }
      components={customComponents}
    >
      {content}
    </ReactMarkdown>
  </>
)

export default MarkdownContent
