import { supabase } from "@/supabase";
import Link from "next/link";
import { GetStaticProps } from "next";

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
  const groupedPosts = posts.reduce((acc, post) => {
    const year = new Date(post.created_at).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {} as Record<number, Post[]>);

  return (
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Writing</h1>
      {Object.entries(groupedPosts)
        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 최신 연도 우선 정렬
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
                        <div className="relative group">
                          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-md cursor-help">
                                               {post.source_name.charAt(0)}
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-xs">

                                                        아웃링크: {post.source_name}
                          </div>
                        </div>
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
    console.error("Error fetching posts:", error);
    return { props: { posts: [] } };
  }

  return {
    props: { posts },
    revalidate: 60,
  };
};
