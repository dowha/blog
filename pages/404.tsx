import { useRouter } from "next/router";


export default function Custom404() {
  const router = useRouter();
  
  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">404 Not Found</h1>
      <div className="mt-6 w-full mx-auto aspect-video">
        <iframe
          className="w-full h-full rounded-lg shadow-lg"
          src="https://www.youtube.com/embed/08DjMT-qR9g"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <p className="mt-4">
        길을 잃으셨군요. 하지만 걱정 마세요. 저도 가끔 길을 잃곤 합니다.
        <br />
        좌측(모바일에서는 상단)의 메뉴를 통해 길을 찾아주세요.
      </p>
      <button
          onClick={() => router.push('/')}
          className="text-xs mt-6 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-md"
        >
          포기 말기
        </button>
    </article>
  )
}
