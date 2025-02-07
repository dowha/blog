import { supabase } from "@/supabase";
import Link from "next/link";
import { GetStaticProps } from "next";

// ✅ 정확한 타입 정의
type Post = {
  title: string;
  slug: string;
  created_at: string;
  is_external: boolean;
  external_url?: string;
  source_name?: string;
};

type Props = {
  posts: Post[];
};

export default function WritingPage({ posts }: Props) {
  // ✅ 연도를 기준으로 그룹핑
  const groupedPosts = posts.reduce((acc, post) => {
    const year = new Date(post.created_at).getFullYear(); // 연도 추출
    if (!acc[year]) acc[year] = []; // 연도별 배열 초기화
    acc[year].push(post);
    return acc;
  }, {} as Record<number, Post[]>);

  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Writing</h1>
      {Object.entries(groupedPosts)
        .sort(([a], [b]) => Number(b) - Number(a)) // 최신 연도가 위로 오도록 정렬
        .map(([year, posts]) => (
          <section key={year} className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700">{year}</h2>
            <div className="mt-2 space-y-2">
              {posts.map((post) => (
                <div key={post.slug} className="flex items-center justify-between">
                  {post.is_external && post.external_url ? (
                    <a
                      href={post.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2"
                    >
                      {post.source_name && (
                        <>
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full cursor-help">
                            아웃링크: {post.source_name}
                          </span>
                          <span className="text-gray-600 text-xs">{post.source_name.charAt(0)}</span>
                        </>
                      )}
                      <span className="text-gray-800 text-sm">{post.title}</span>
                    </a>
                  ) : (
                    <Link href={`/post/${post.slug}`} className="flex items-center">
                      {post.title}
                    </Link>
                  )}
                  <span className="text-sm text-gray-500 font-mono whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
    </article>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, created_at, slug, is_external, external_url, source_name")
    .eq("status", "public")
    .order("created_at", { ascending: false });

  if (error || !posts) {
    return { props: { posts: [] } };
  }

  return {
    props: { posts },
    revalidate: 60, // ✅ ISR 적용 (60초마다 새로운 데이터 반영)
  };
};
