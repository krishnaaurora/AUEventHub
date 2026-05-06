export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getPool, ensureStudentTransactionTables } from '../../_lib/pg'

/**
 * Handles saving and retrieving certificate template settings in PostgreSQL
 */
export async function GET(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (eventId) {
      const result = await pool.query(
        'SELECT * FROM certificate_templates WHERE event_id = $1',
        [eventId]
      )
      if (result.rowCount === 0) {
        return NextResponse.json({ message: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    }

    // Otherwise return all templates for a library view
    const result = await pool.query(
      'SELECT id, event_id, template_name, image_url, settings, created_at FROM certificate_templates ORDER BY created_at DESC'
    )
    return NextResponse.json({ items: result.rows })
  } catch (error) {
    console.error('[CERTIFICATE TEMPLATES GET] Error:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()
    const { event_id, image_url, template_name, name_pos, event_pos, date_pos, settings } = body

    if (!image_url) {
      return NextResponse.json({ message: 'image_url is required' }, { status: 400 })
    }

    // Merge positions into settings if provided separately (for backward compatibility)
    const finalSettings = {
      ...(settings || {}),
      name_pos: name_pos || settings?.name_pos,
      event_pos: event_pos || settings?.event_pos,
      date_pos: date_pos || settings?.date_pos
    }

    // Try to update existing for this event, or insert new
    let result
    if (event_id) {
      result = await pool.query(
        `INSERT INTO certificate_templates (event_id, template_name, image_url, settings, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (event_id) DO UPDATE SET 
           template_name = EXCLUDED.template_name,
           image_url = EXCLUDED.image_url,
           settings = EXCLUDED.settings,
           updated_at = NOW()
         RETURNING *`,
        [event_id, template_name || 'Event Template', image_url, JSON.stringify(finalSettings)]
      )
    } else {
      result = await pool.query(
        `INSERT INTO certificate_templates (template_name, image_url, settings, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [template_name || 'Generic Template', image_url, JSON.stringify(finalSettings)]
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Template saved successfully to PostgreSQL',
      item: result.rows[0]
    })
  } catch (error) {
    console.error('[CERTIFICATE TEMPLATES POST] Error:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
