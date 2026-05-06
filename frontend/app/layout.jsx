import Providers from './providers'
import SplitDashboardDecorator from './components/layout/SplitDashboardDecorator'
import PageTransition from './components/layout/PageTransition'
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
            <PageTransition>
              {children}
            </PageTransition>
          </SplitDashboardDecorator>
        </Providers>
      </body>
    </html>
  )
}
