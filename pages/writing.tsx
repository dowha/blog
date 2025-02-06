import { supabase } from "@/supabase";
import Link from "next/link";
import { GetStaticProps } from "next";

// ✅ 정확한 타입 정의
type Post = {
  title: string;
  slug: string;
  created_at: string;
};

type Props = {
  posts: Post[];
};

export default function WritingPage({ posts }: Props) {
  return (
    <article className="pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h3 className="text-xl font-bold">Writing</h3>
      {posts.map((post) => (
        <div key={post.slug} className="mt-4">
          <Link href={`/post/${post.slug}`} className="text-neutral-950 hover:underline">
            {post.title}
          </Link>
          <span className="text-sm text-neutral-400 ml-2">
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
    .select("title, created_at, slug")
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
