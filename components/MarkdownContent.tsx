import React, { FC, HTMLAttributes } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Image from 'next/image'
import { ComponentProps } from 'react'

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
    const isInternalLink = href.startsWith('/')
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
          className="bg-gray-100 text-[#0a85d1] px-1 py-0.5 rounded whitespace-nowrap"
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
      <span className="font-mono text-xs" {...filteredProps}>
        {children}
      </span>
    )
  },
}

// ⑤ MarkdownContent 컴포넌트에서 확장된 customComponents 사용
const MarkdownContent = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={customComponents}
  >
    {content}
  </ReactMarkdown>
)

export default MarkdownContent
