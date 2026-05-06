export const dynamic = 'force-dynamic'
import { pingPostgres } from '../_lib/pg'
import { pingMongo } from '../_lib/db'

export async function GET() {
  try {
    const [postgresOk, mongoOk] = await Promise.all([pingPostgres(), pingMongo()])

    return Response.json({
      ok: postgresOk && mongoOk,
      postgres: postgresOk ? 'up' : 'down',
      mongo: mongoOk ? 'up' : 'down',
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        postgres: 'down',
        mongo: 'down',
        error: error?.message || 'Database ping failed',
      },
      { status: 500 }
    )
  }
}
