import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react"
import Head from "next/head";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import { wrapper } from "../store/store";
import { useStore, Provider } from "react-redux";

function App({ Component, pageProps: { session, ...pageProps } }) {
  const store = useStore()

  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <Head>
            <title>Music Swipe</title>
            <meta name="description" content="" />
            <meta name="theme-color" content="#1E073B" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <ToastContainer />
        <Component {...pageProps} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.5/flowbite.min.js" async />
      </Provider>
    </SessionProvider>
  )
}

export default wrapper.withRedux(App)