import { Html, Head, Main, NextScript } from 'next/document'
import type { DocumentProps } from 'next/document'

export default function Document(props: DocumentProps) {
  return (
    <Html lang="en">
      <Head>
        {/* Disable automatic preload of fonts and CSS to fix warnings */}
        <meta name="next-font-preconnect" />
        <meta name="next-size-adjust" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 