import Providers from './providers'
import '../src/index.css'
import 'lenis/dist/lenis.css'

export const metadata = {
  title: 'AU Event Hub',
  description: 'University events landing and authentication portal'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
