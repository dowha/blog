import fs from 'fs'
import path from 'path'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** /desk 표기 규칙: docs/style-guide.md를 그대로 보여준다 (규칙 원본은 이 파일 하나) */
export default function DeskStyle({ markdown }: { markdown: string }) {
  return (
    <>
      <Head>
        <title>{"Style | Desk | Dowha's Blog"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="page-container style-guide">
        <div className="mb-6 flex items-center justify-end">
          <Link href="/desk" className="text-xs text-gray-400 hover:text-gray-700">
            ← Desk
          </Link>
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { markdown: fs.readFileSync(path.join(process.cwd(), 'docs/style-guide.md'), 'utf-8') },
})
