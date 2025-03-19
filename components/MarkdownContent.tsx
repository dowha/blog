import React, { FC, HTMLAttributes } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Image from 'next/image'
import { ComponentProps } from 'react'
// rehype-sanitize를 추가하여 안전한 HTML 처리
import rehypeSanitize from 'rehype-sanitize'

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
    const youtubeEmbedUrl = extractYouTubeEmbedUrl(href);

    const childrenText = React.Children.map(children ?? [], (child) =>
      typeof child === 'string' ? child : ''
    )?.join('') ?? '';

    const isBareLink = childrenText.trim() === href;

    // ✅ 1. 단독 YouTube URL → iframe으로 변환
    if (youtubeEmbedUrl && isBareLink) {
      return (
        <div className="mt-6 w-full mx-auto aspect-video youtube-embed">
          <iframe
            className="w-full h-full rounded-lg shadow-lg"
            src={youtubeEmbedUrl}
            title="YouTube video player"
            allowFullScreen
          />
        </div>
      );
    }

    // ✅ 2. [YouTube 링크](URL) 또는 [일반 링크](URL) → <a> 태그로 출력
    return (
      <a href={href} {...props} target="_blank" rel="noopener">
        {children}
      </a>
    );
  },

  p: ({ children, ...props }) => {
    // 1. 먼저 children에 div나 youtube embed 등 블록 요소가 포함되어 있는지 확인
    let hasBlockElements = false;
    
    React.Children.forEach(children, child => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement;
        
        // div, iframe, figure 태그인지 확인
        if (['div', 'iframe', 'figure'].includes(String(element.type))) {
          hasBlockElements = true;
        }
        
        // youtube-embed 클래스를 가진 요소인지 확인
        if (
          typeof element.props === 'object' && 
          element.props !== null && 
          'className' in element.props && 
          typeof element.props.className === 'string' && 
          element.props.className.includes('youtube-embed')
        ) {
          hasBlockElements = true;
        }
        
        // youtube-only-line 클래스를 가진 div도 확인
        if (
          element.type === 'div' &&
          typeof element.props === 'object' && 
          element.props !== null && 
          'className' in element.props && 
          typeof element.props.className === 'string' && 
          element.props.className.includes('youtube-only-line')
        ) {
          hasBlockElements = true;
        }
      }
    });

    // 블록 요소가 포함되어 있으면 p 태그 없이 직접 children만 렌더링
    if (hasBlockElements) {
      return <>{children}</>;
    }
    
    // 블록 요소가 없는 경우에만 p 태그로 래핑하여 반환
    return <p {...props}>{children}</p>;
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

  // ④ date 태그 커스텀 렌더러
  date: ({ children, ...props }) => {
    return (
      <span className="font-mono text-xs" {...props}>
        {children}
      </span>
    )
  },
}

// 유튜브 URL만 있는 경우 처리를 위한 전처리 함수
const preprocessMarkdown = (content: string) => {
  // YouTube URL만 있는 줄을 감지하여 특수 마커로 감싸기
  // HTML 태그 형태가 아닌 마크다운 구문으로 변환하여 reactMarkdown이 적절히 처리하도록 함
  return content.replace(
    /^(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+)$/gm,
    (match) => match
  );
};

// ⑤ MarkdownContent 컴포넌트에서 확장된 customComponents 사용
const MarkdownContent = ({ content }: { content: string }) => {
  // 컨텐츠 전처리
  const processedContent = preprocessMarkdown(content);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={customComponents}
      skipHtml={false}
      unwrapDisallowed={true}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

export default MarkdownContent
