import Providers from './providers'
import SplitDashboardDecorator from './components/layout/SplitDashboardDecorator'
import '../src/index.css'
import 'lenis/dist/lenis.css'

export const metadata = {
  title: 'Aurora University Event Hub',
  description: 'University EVENT landing and authentication portal'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SplitDashboardDecorator>
            {children}
          </SplitDashboardDecorator>
        </Providers>
      </body>
    </html>
  )
}
