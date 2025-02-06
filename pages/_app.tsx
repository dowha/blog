import "@/styles/globals.css"; // TailwindCSS 스타일 적용
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{"Dowha's Blog"}</title> {/* 개별 페이지 타이틀 관리 */}
      </Head>
      <Layout>
        <div className="fixed sm:hidden h-6 sm:h-10 md:h-14 w-full top-0 left-0 z-30 pointer-events-none content-fade-out"></div>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
