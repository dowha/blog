import "@/styles/globals.css"; // TailwindCSS 스타일 적용
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
