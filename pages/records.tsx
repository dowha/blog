import { supabase } from '@/supabase'
import { GetStaticProps } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ✅ 정확한 타입 정의
type Record = {
  title: string
  content: string
  created_at: string
}

type Props = {
  records: Record[]
}

export default function RecordsPage({ records }: Props) {
  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Records</h1>
      <p className="mt-4">한 해의 기록들. </p>

      {records.map((record) => (
        <div key={record.title} className="mt-14 pb-2">
          {' '}
          <h2 className="text-md font-semibold">{record.title}</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {record.content}
          </ReactMarkdown>
          <div className="relative hidden md:flex justify-center py-4 my-4">
            <div className="mx-auto text-gray-500">*</div>
          </div>
        </div>
      ))}
    </article>
  )
}

// ✅ 타입을 명확히 지정하여 `getStaticProps` 수정
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
    revalidate: 60, // ✅ ISR 적용 (60초마다 새로운 데이터 반영)
  }
}
