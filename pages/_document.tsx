import { Html, Head, Main, NextScript } from "next/document";
import Footer from "@/components/footer";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body className="flex min-h-screen antialiased">
        <Main />
        <NextScript />
        <Footer />

      </body>
    </Html>
  );
}
