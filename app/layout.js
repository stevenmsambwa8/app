import './globals.css'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ThemeProvider from '../components/ThemeProvider'
import ThemeScript from '../components/ThemeScript'

export const metadata = {
  title: 'Advat — Shiriki Matukio Yako',
  description: 'Ukurasa wa kijamii wa kufurahisha kuchapisha, ku-flex na kuungana.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <TopBar />
          <main>{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
