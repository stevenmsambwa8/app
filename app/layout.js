import './globals.css'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export const metadata = {
  title: 'Advat — Play. Flex. Connect.',
  description: 'The fun social page for East African gamers.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
