import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from '@/supabase'
import Seo from "@/components/Seo";

export default function Home() {
  const [mostLikedPost, setMostLikedPost] = useState<{ title: string; slug: string } | null>(null);

  useEffect(() => {
    async function getMostLikedPost() {
      const post = await fetchMostLikedPost();
      if (post) {
        setMostLikedPost(post);
      }
    }

    getMostLikedPost();
  }, []);

  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">{"Dowha's Blog"}</h1>
        <p className="mt-4 index-contents text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{" "}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.<br />
          질문이나 피드백, 협업 제안 등은{" "}
          <a
            href="https://letterbird.co/hello-7bc2f9f1"
            target="_blank"
            rel="noopener"
          >
            메일 폼
          </a>
          을 통해서 연락해 주세요.
        </p>

        {/* 가장 좋아요 많은 글 표시 */}
        {mostLikedPost && (
          <div className="mt-8 mb-6 relative">
            <div className="border border-gray-200 rounded-md p-3 pt-4 hover:border-gray-300 transition-colors">
              <span className="absolute top-0 left-3 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                🔥 가장 인기 있는 글
              </span>
              <Link href={`/posts/${mostLikedPost.slug}`} className="block mt-2 text-blue-500">
                {mostLikedPost.title}
              </Link>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
