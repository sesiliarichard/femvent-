import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FemVents Admin</title>
        <link rel="icon" href="/icon.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
