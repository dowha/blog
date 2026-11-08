import fs from 'fs'
import path from 'path'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** 표기 규칙 공개 페이지. 원본은 docs/style-guide.md 하나이고, 배포할 때 이 파일을 읽어 그린다 */
export default function StyleGuide({ markdown }: { markdown: string }) {
  return (
    <>
      <Head>
        <title>{"Style | Dowha's Blog"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="page-container style-guide">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { markdown: fs.readFileSync(path.join(process.cwd(), 'docs/style-guide.md'), 'utf-8') },
})
