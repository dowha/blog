import { supabase } from '@/supabase'
import { GetStaticProps } from 'next'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import MarkdownContent from '@/components/MarkdownContent'
import Seo from '@/components/Seo'
import { CopyLinkButton } from '@/components/ActionButtons'

type Record = {
  title: string
  content: string
  created_at: string
  slug: string
}

type Props = {
  records: Record[]
}

function Collapse({
  title,
  slug,
  children,
  isLast,
  openedSlug,
  setOpenedSlug,
}: {
  title: string
  slug: string
  children: React.ReactNode
  isLast: boolean
  openedSlug: string | null
  setOpenedSlug: (slug: string | null) => void
}) {
  const router = useRouter()
  const isOpen = openedSlug === slug

  const handleToggle = () => {
    if (isOpen) {
      setOpenedSlug(null)
      router.push('', undefined, { shallow: true })
    } else {
      setOpenedSlug(slug)
      router.push(`#${slug}`, undefined, { shallow: true })
    }
  }

  return (
    <div className={`border-t border-gray-300 ${isLast ? 'border-b' : ''}`}>
      <button
        onClick={handleToggle}
        className="group w-full text-left pl-2 pr-4 py-2 focus:outline-none flex items-center justify-between"
      >
        <h2
          className={`${
            isOpen ? 'text-gray-800' : 'group-hover:text-gray-800'
          }`}
        >
          {title}
        </h2>
        <svg
          className={`h-4 w-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
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
      {isOpen && (
        <div className="record-contents py-2 pl-2 pr-4">{children}</div>
      )}
    </div>
  )
}

export default function RecordsPage({ records }: Props) {
  const router = useRouter()
  const [openedSlug, setOpenedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashIndex = router.asPath.indexOf('#')
      const hasQuery = router.asPath.includes('?')
      let hash = ''

      if (hashIndex !== -1) {
        hash = router.asPath.substring(hashIndex + 1)
        if (hasQuery) {
          hash = hash.split('?')[0]
        }
      }

      if (hash) {
        setOpenedSlug(hash)
      }
    }
  }, [router.asPath])

  const openedRecord = openedSlug
    ? records.find((record) => record.slug === openedSlug)
    : null

  const pageTitle = openedRecord ? `${openedRecord.title}` : 'Records'

  const descriptionText = ` 별도의 글로 쓰기에는 애매한 기록을 모아둡니다. 주로 개인적인 어떤
          목록과 그에 대한 짧은 소회를 담은 메모 따위입니다.`
  return (
    <>
      <Seo title={pageTitle} description={descriptionText} />
      <article className="records page-container">
        <h1 className="text-xl font-bold">Records</h1>
        <p className="mt-4 text-keepall">{descriptionText}</p>

        {records.map((record, index) => (
          <div key={record.slug} className={index === 0 ? 'mt-6' : ''}>
            <Collapse
              title={record.title}
              slug={record.slug}
              isLast={index === records.length - 1}
              openedSlug={openedSlug}
              setOpenedSlug={setOpenedSlug}
            >
              <MarkdownContent content={record.content} />
              <CopyLinkButton slug={record.slug} isRecordPage />
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
    .select('title, content, created_at, slug')
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  if (error || !records) {
    return { props: { records: [] } }
  }

  return {
    props: { records },
    revalidate: 60,
  }
}
