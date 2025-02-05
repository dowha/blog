import { supabase } from "@/supabase";
import { GetStaticProps } from "next";

// ✅ 정확한 타입 정의
type Record = {
  title: string;
  content: string;
  created_at: string;
};

type Props = {
  records: Record[];
};

export default function RecordsPage({ records }: Props) {
  return (
    <main className="p-6">
      <h3 className="text-xl font-bold">Records</h3>
      {records.map((record) => (
        <div key={record.title} className="mt-4">
          <h2 className="text-lg font-semibold">{record.title}</h2>
          <p className="text-neutral-700">{record.content}</p>
          <span className="text-sm text-neutral-400">
            {new Date(record.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
          </span>
        </div>
      ))}
    </main>
  );
}

// ✅ 타입을 명확히 지정하여 `getStaticProps` 수정
export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: records, error } = await supabase
    .from("records")
    .select("title, content, created_at")
    .eq("status", "public")
    .order("created_at", { ascending: false });

  if (error || !records) {
    return { props: { records: [] } };
  }

  return {
    props: { records },
    revalidate: 60, // ✅ ISR 적용 (60초마다 새로운 데이터 반영)
  };
};
