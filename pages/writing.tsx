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
  source_name?: string; // ✅ source_name 추가
};

type Props = {
  posts: Post[];
};

export default function WritingPage({ posts }: Props) {
  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Writing</h1>
      {posts.map((post) => (
        <div key={post.slug} className="flex items-center justify-between mt-2">
          {post.is_external && post.external_url ? (
            <a
              href={post.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2"
            >
              {/* ✅ source_name이 있을 경우 툴팁 추가 */}
              {post.source_name && (
                <div className="relative group">
<span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-md cursor-help">
                    {post.source_name.charAt(0)}
                  </span>
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-xs">
                    아웃링크: {post.source_name}
                  </div>
                </div>
              )}
              <span>{post.title}</span>
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
    </article>
  );
}

// ✅ `source_name`을 포함하여 데이터 가져오기
export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, created_at, slug, is_external, external_url, source_name") // ✅ source_name 추가
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
