export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { runEventLifecycleAutomation } from '../../_lib/event-lifecycle'

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader === `Bearer ${cronSecret}`) {
      return true
    }
  }

  const configuredKey = process.env.EVENT_LIFECYCLE_KEY
  if (!configuredKey) {
    // Allow manual invocation in environments where no key is configured.
    return true
  }

  const headerKey = request.headers.get('x-lifecycle-key')
  return headerKey === configuredKey
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: 'Unauthorized lifecycle invocation' }, { status: 401 })
    }

    const result = await runEventLifecycleAutomation()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Event lifecycle automation error:', error)
    return NextResponse.json({ message: 'Failed to run event lifecycle automation' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: 'Unauthorized lifecycle invocation' }, { status: 401 })
    }

    const result = await runEventLifecycleAutomation()
    return NextResponse.json({
      ...result,
      trigger: 'scheduled_or_manual_get',
    })
  } catch (error) {
    console.error('Event lifecycle GET automation error:', error)
    return NextResponse.json({ message: 'Failed to run event lifecycle automation' }, { status: 500 })
  }
}
