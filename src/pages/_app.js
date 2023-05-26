import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react"
import Head from "next/head";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <>
      <SessionProvider session={session}>
        <Head>
            <title>Music Swipe</title>
            <meta name="description" content="" />
            <meta name="theme-color" content="#1E073B" />
        </Head>
        <Component {...pageProps} />
      </SessionProvider>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.5/flowbite.min.js" async />
    </>
  )
}
