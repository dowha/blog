import { supabase } from "@/supabase";
import RSS from "rss";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Supabase에서 `is_external = false`인 데이터만 가져오기 (content 추가)
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, slug, created_at, content") // ✅ content 추가
    .eq("status", "public")
    .eq("is_external", false)
    .order("created_at", { ascending: false }) // ✅ 최신순 정렬
    .limit(10); // ✅ 최신 10개만 가져오기

  if (error || !posts) {
    return res.status(500).json({ error: "Failed to fetch posts" });
  }

  // ✅ RSS 피드 생성
  const feed = new RSS({
    title: "Dowha's Blog RSS Feed",
    description: "Latest blog posts",
    site_url: "https://blog.dowha.kim",
    feed_url: "https://blog.dowha.kim/api/rss",
    language: "ko", // ✅ 한국어 설정
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.content ? post.content.slice(0, 100) + "..." : "", // ✅ `post.content` 일부 삽입
      url: `https://blog.dowha.kim/posts/${post.slug}`,
      date: post.created_at,
    });
  });

  // ✅ 한글 인코딩 문제 해결 (UTF-8 명확히 설정)
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.status(200).send(feed.xml());
}
