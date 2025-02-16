import Seo from '@/components/Seo'

export default function Home() {
  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">{"Dowha's Blog"}</h1>
        <p className="mt-4 index-contents text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{' '}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.<br />      
          질문이나 피드백, 협업 제안 등은{' '}
          <a
            href="https://letterbird.co/hello-7bc2f9f1"
            target="_blank"
            rel="noopener noreferrer"
          >
            여기
          </a>
          를 통해서 메일 주세요.
        </p>
      </article>
    </>
  )
}
