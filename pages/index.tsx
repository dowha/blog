import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from '@/supabase'
import Seo from "@/components/Seo";

async function fetchMostLikedPost() {
  console.log("Fetching most liked post...");

  // 가장 좋아요를 많이 받은 post_id 찾기
  const { data: likesData, error: likesError } = await supabase
    .from("post_likes")
    .select("post_id, count", { count: "exact" }) // count 필드 추가
    .order("count", { ascending: false })
    .limit(1);

  console.log("Likes Data:", likesData);

  if (likesError) {
    console.error("Error fetching most liked post:", likesError);
    return;
  }

  if (!likesData || likesData.length === 0) {
    console.log("No liked posts found.");
    return;
  }

  const mostLikedPostId = likesData[0].post_id;
  console.log("Most liked post ID:", mostLikedPostId);

  // 해당 post_id의 posts 정보 가져오기
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("title, slug")
    .eq("id", mostLikedPostId)
    .single();

  console.log("Post Data:", postData);

  if (postError) {
    console.error("Error fetching post details:", postError);
    return;
  }

  return postData;
}


export default function Home() {
  const [mostLikedPost, setMostLikedPost] = useState<{ title: string; slug: string } | null>(null);

  useEffect(() => {
    async function getMostLikedPost() {
      const post = await fetchMostLikedPost(); // 여기에 fetchMostLikedPost 호출
      if (post) {
        setMostLikedPost(post);
      }
    }

    getMostLikedPost(); // 페이지 로드 시 실행
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
