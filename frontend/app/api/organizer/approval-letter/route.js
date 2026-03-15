import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const category = String(body.category || '').trim()
    const department = String(body.department || '').trim()
    const venue = String(body.venue || '').trim()
    const startDate = String(body.start_date || '').trim()
    const endDate = String(body.end_date || '').trim()
    const startTime = String(body.start_time || '').trim()
    const endTime = String(body.end_time || '').trim()
    const organizer = String(body.organizer || '').trim()
    const description = String(body.description || '').trim()
    const maxParticipants = body.max_participants || 'N/A'
    const guestSpeakers = String(body.guest_speakers || 'None').trim()

    if (!title || !category || !venue || !startDate) {
      return NextResponse.json(
        { message: 'Title, category, venue, and start date are required.' },
        { status: 400 }
      )
    }

    const dateStr = endDate && endDate !== startDate
      ? `${startDate} to ${endDate}`
      : startDate
    const timeStr = endTime && endTime !== startTime
      ? `${startTime} to ${endTime}`
      : startTime || 'TBD'
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    const letter = `APPROVAL REQUEST LETTER

Date: ${today}

To,
The Dean of Student Affairs
Aurora University

Subject: Request for Approval to Conduct "${title}"

Respected Sir/Madam,

I, ${organizer || '[Organizer Name]'}, am writing to formally request approval to organize the event titled "${title}" under the ${category} category${department ? ` for the ${department} department` : ''}.

Event Details:
- Event Title: ${title}
- Category: ${category}${department ? `\n- Department: ${department}` : ''}
- Venue: ${venue}
- Date: ${dateStr}
- Time: ${timeStr}
- Expected Participants: ${maxParticipants}
- Guest Speakers: ${guestSpeakers}

Event Description:
${description || 'A comprehensive event aimed at enhancing student engagement and practical learning opportunities.'}

I kindly request your approval to proceed with the preparations for this event. All necessary arrangements for venue setup, safety protocols, and logistics will be managed by the organizing committee.

I assure you that the event will be conducted in an orderly manner and in compliance with all university guidelines and regulations.

Thank you for your time and consideration. I look forward to your favorable response.

Yours sincerely,
${organizer || '[Organizer Name]'}
Event Organizer
Aurora University`

    return NextResponse.json({ letter })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to generate approval letter.', detail: error.message },
      { status: 500 }
    )
  }
}
