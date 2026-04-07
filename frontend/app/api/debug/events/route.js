import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventsCollection } from '../../_lib/db'

export async function GET() {
  try {
    await ensureStudentEventCollections()
    const col = await getEventsCollection()
    const all = await col.find({}).toArray()
    
    const counts = {};
    for (const e of all) counts[e.status] = (counts[e.status] || 0) + 1;
    
    return NextResponse.json({ total: all.length, counts })
  } catch (error) {
    return NextResponse.json({ error: error.message })
  }
}
