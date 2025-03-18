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

// ② YouTube 링크 추출 함수 (원본 그대로)
const extractYouTubeEmbedUrl = (url: string) => {
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
  const match = url.match(youtubeRegex)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

// ③ 커스텀 렌더러(ExtendedComponents 타입 사용)
const customComponents: ExtendedComponents = {
 a: ({ href = '', children, ...props }) => {
  // props에서 node를 제거하고 나머지 props만 사용
  const { node, ...restProps } = props;
  const youtubeEmbedUrl = extractYouTubeEmbedUrl(href);
  const childrenArray = React.Children.toArray(children);
  const isBareLink =
    childrenArray.length === 1 &&
    typeof childrenArray[0] === 'string' &&
    childrenArray[0].trim() === href;

  if (youtubeEmbedUrl && isBareLink) {
    return (
      <div className="mt-6 w-full mx-auto aspect-video">
        <iframe
          className="w-full h-full rounded-lg shadow-lg"
          src={youtubeEmbedUrl}
          title="YouTube video player"
          allowFullScreen
        />
      </div>
    );
  }

  if (href.startsWith('/')) {
    return <a href={href} {...restProps} />;
  }

  return (
    <a href={href} {...restProps} target="_blank" rel="noopener">
      {children}
    </a>
  );
},

  p: ({ children }) => {
    const hasBlockElements = React.Children.toArray(children).some((child) => {
      if (typeof child === 'object' && child !== null && 'type' in child) {
        if (typeof child.type === 'string') {
          return ['div', 'iframe'].includes(child.type)
        }
        return true
      }
      return false
    })
    if (hasBlockElements) {
      return <>{children}</>
    }
    return <p>{children}</p>
  },

  img: ({ src = '', alt = '이미지' }) => (
    <div className="flex justify-center my-4">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        className="max-w-full h-auto rounded-lg shadow-md"
      />
    </div>
  ),

  iframe: ({ style, ...props }) => (
    <div className="mt-6 w-full mx-auto">
      <iframe
        {...props}
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
  ),

  code: ({ className, children, ...props }: ComponentProps<'code'>) => {
    // ✅ 블록 코드인지 확인 (className이 있거나, 여러 줄이면 블록 코드)
    const isBlock = className || String(children).includes('\n')

    if (!isBlock) {
      return (
        <code className="bg-gray-100 text-[#0a85d1] px-1 py-0.5 rounded whitespace-nowrap">
          {children}
        </code>
      )
    }

    return (
      <pre className="bg-gray-900 text-white mt-6 text-sm p-4 rounded-lg overflow-auto">
        <code className={className} {...props}>
          {Array.isArray(children)
            ? children.join('')
            : String(children).trim()}
        </code>
      </pre>
    )
  },

  // ④ date 태그 커스텀 렌더러 (node 제거, any 제거)
  date: ({ children, ...props }) => {
    return (
      <span className="font-mono text-xs" {...props}>
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
