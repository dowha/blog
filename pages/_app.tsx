import "@/styles/globals.css"; // TailwindCSS 스타일 적용
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
    <Head>
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#ffffff" />
  </Head>
    <Layout>
      <Component {...pageProps} />
    </Layout>
    </>
  );
}
