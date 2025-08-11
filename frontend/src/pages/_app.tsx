import '../styles/globals.css'
import '@aws-amplify/ui-react/styles.css'
import type { AppProps } from 'next/app'
import ThemeProvider from '../components/theme/ThemeProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <div className="bg-background text-foreground">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}
