import Seo from '@/components/Seo'

export default function Home() {
  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">
          <a href="https://dowha.kim" target="_blank" rel="noopener">
            Dowha
          </a>
          {"'s Blog"}
        </h1>
        <p className="mt-4 text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{' '}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.
        </p>
      </article>
    </>
  )
}
