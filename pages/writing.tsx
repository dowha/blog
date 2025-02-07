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
};

type Props = {
  posts: Post[];
};

export default function WritingPage({ posts }: Props) {
  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Writing</h1>
      {posts.map((post) => (
        <div key={post.slug} className="mt-2">
          {post.is_external && post.external_url ? (
            <a
              href={post.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1"
            >
              <span>{post.title}     <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg></span>
            
            </a>
          ) : (
            <Link href={`/post/${post.slug}`}>
              {post.title}
            </Link>
          )}
          <span className="text-sm text-gray-500 ml-2">
            {new Date(post.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
          </span>
        </div>
      ))}
    </article>
  );
}

// ✅ 타입을 명확히 지정하여 `getStaticProps` 수정
export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, created_at, slug, is_external, external_url") // is_external 및 external_url 추가
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
