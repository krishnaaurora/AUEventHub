/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Ensure the app knows about our Flask backend API if needed for rewrites
  async rewrites() {
    return [
      {
        source: '/api/flask/:path*',
        destination: 'http://localhost:5000/:path*', // Proxy to Flask
      },
    ]
  },
}
export default nextConfig
