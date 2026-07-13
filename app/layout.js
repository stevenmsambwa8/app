import './globals.css'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ThemeProvider from '../components/ThemeProvider'
import ThemeScript from '../components/ThemeScript'

export const metadata = {
  title: 'Advat — Share your moments',
  description: 'The fun social page to post, flex and connect.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
