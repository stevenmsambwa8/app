import './globals.css'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Sidebar from '../components/Sidebar'
import RightRail from '../components/RightRail'
import ThemeProvider from '../components/ThemeProvider'
import AuthModalProvider from '../components/AuthModalProvider'
import PostsProvider from '../components/PostsProvider'
import PostViewerProvider from '../components/PostViewerProvider'
import ThemeScript from '../components/ThemeScript'

export const metadata = {
  title: 'Advat — Shiriki Matukio Yako',
  description: 'Ukurasa wa kijamii wa kufurahisha kuchapisha, ku-flex na kuungana.',
  icons: {
    icon: '/advat-multi.png',
    shortcut: '/advat-multi.png',
    apple: '/advat-multi.png',
  },
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
          <AuthModalProvider>
            <PostsProvider>
              <PostViewerProvider>
                <div className="app-shell">
                  <Sidebar />
                  <div className="app-content">
                    <TopBar />
                    <main>{children}</main>
                  </div>
                  <RightRail />
                </div>
                <BottomNav />
              </PostViewerProvider>
            </PostsProvider>
          </AuthModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
