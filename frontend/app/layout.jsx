import './globals.css'

export const metadata = {
  title: 'AI-EVENTMANG Frontend',
  description: 'Minimal Next.js frontend structure'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
