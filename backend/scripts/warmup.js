/**
 * API Cache Pre-warmer
 * Run this on server startup or via a cron job to ensure 
 * common Dean API endpoints are cached before first use.
 */

async function warmup() {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoints = [
    '/api/dean/events?filter=pending&page=1&limit=20',
    '/api/dean/events?filter=approved&page=1&limit=20',
    '/api/dean/events?filter=rejected&page=1&limit=20',
    '/api/dean/events?page=1&limit=20',
    '/api/dean/stats'
  ];

  console.log(`🚀 Starting cache warmup for ${endpoints.length} endpoints...`);

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Cookie': 'next-auth.session-token=WARMUP_TOKEN' // You may need a valid session for protected routes
        }
      });
      const end = Date.now();
      
      if (res.ok) {
        console.log(`✅ Warmed up: ${endpoint} (${end - start}ms)`);
      } else {
        console.log(`⚠️  Warmup failed for ${endpoint}: ${res.status}`);
      }
    } catch (err) {
      console.error(`❌ Error warming up ${endpoint}:`, err.message);
    }
  }

  console.log('✨ Cache warmup complete.');
}

warmup();
