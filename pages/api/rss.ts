import { supabase } from "@/supabase";
import RSS from "rss";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Supabase에서 `is_external = false`인 데이터만 가져오기
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, slug, created_at")
    .eq("status", "public")
    .eq("is_external", false); // ✅ 외부 글 제외

  if (error || !posts) {
    return res.status(500).json({ error: "Failed to fetch posts" });
  }

  // ✅ RSS 피드 생성
  const feed = new RSS({
    title: "My Blog RSS Feed",
    description: "Latest blog posts",
    site_url: "https://blog.dowha.kim",
    feed_url: "https://blog.dowha.kim/rss.xml",
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: `Read more about ${post.title}`,
      url: `https://blog.dowha.kim/posts/${post.slug}`,
      date: post.created_at,
    });
  });

  res.setHeader("Content-Type", "application/rss+xml");
  res.status(200).send(feed.xml());
}
