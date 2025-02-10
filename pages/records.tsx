import { supabase } from '@/supabase'
import { GetStaticProps } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw' // ✅ HTML 지원을 위해 추가
import { useState } from 'react'
import Seo from '@/components/Seo'

type Record = {
  title: string
  content: string
  created_at: string
}

type Props = {
  records: Record[]
}

function Collapse({
  title,
  children,
  isLast,
}: {
  title: string
  children: React.ReactNode
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border-t border-gray-300 ${isLast ? 'border-b' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left pl-2 pr-4 py-2 focus:outline-none flex items-center justify-between"
      >
        <h2>{title}</h2>
        <svg
          className={`h-4 w-4 transform transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 12a1 1 0 01-.707-.293l-5-5a1 1 0 111.414-1.414L10 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 12z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="record-contents py-2 pl-2 pr-4">{children}</div>}
    </div>
  )
}

export default function RecordsPage({ records }: Props) {
  return (
    <>
      <Seo
        title="Records"
        description="별도의 글로 쓰기에는 애매한 기록을 모아둡니다."
      />
      <article className="records w-full pl-0 pt-6 pb-12 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
        <h1 className="text-xl font-bold">Records</h1>
        <p className="mt-4 text-keepall">
          별도의 글로 쓰기에는 애매한 기록을 모아둡니다. 주로 한 해 동안의 어떤
          목록과 그에 대한 짧은 소회를 담은 메모 따위입니다.
        </p>

        {records.map((record, index) => (
          <div key={record.title} className={index === 0 ? 'mt-6' : ''}>
            <Collapse
              title={record.title}
              isLast={index === records.length - 1}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {record.content}
              </ReactMarkdown>
            </Collapse>
          </div>
        ))}
      </article>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: records, error } = await supabase
    .from('records')
    .select('title, content, created_at')
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  if (error || !records) {
    return { props: { records: [] } }
  }

  return {
    props: { records },
    revalidate: 60, // 60초마다 ISR 적용
  }
}
