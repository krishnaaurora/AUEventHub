import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://jaikrishna_7_mongo:Jai2005.7.@cluster0.zngygka.mongodb.net/'
const dbName = 'AUeventhub_db'

async function approveEvent() {
  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)

    const eventId = 'event_aucinema_1773398702108'

    const events = db.collection('events')
    const approvals = db.collection('event_approvals')
    const aiData = db.collection('event_ai_data')

    // Step 1: Dean approval
    console.log('Dean approving...')
    await events.updateOne({ _id: eventId }, {
      $set: { status: 'pending_registrar', updatedAt: new Date() }
    })

    await approvals.updateOne(
      { event_id: eventId },
      {
        $set: {
          dean_status: 'approved',
          registrar_status: 'pending',
          vc_status: 'pending',
          dean_comment: 'Approved by Dean',
          dean_reviewed_at: new Date().toISOString(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          event_id: eventId,
          submitted_at: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    await aiData.updateOne(
      { event_id: eventId },
      {
        $set: { approval_stage: 'pending_registrar', updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    )

    // Step 2: Registrar approval
    console.log('Registrar approving...')
    await events.updateOne({ _id: eventId }, {
      $set: { status: 'pending_vc', updatedAt: new Date() }
    })

    await approvals.updateOne(
      { event_id: eventId },
      {
        $set: {
          registrar_status: 'approved',
          vc_status: 'pending',
          registrar_comment: 'Approved by Registrar',
          registrar_reviewed_at: new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    )

    await aiData.updateOne(
      { event_id: eventId },
      {
        $set: { approval_stage: 'pending_vc', updatedAt: new Date() },
      }
    )

    // Step 3: VC approval
    console.log('VC approving...')
    await events.updateOne({ _id: eventId }, {
      $set: { status: 'published', published_at: new Date().toISOString(), updatedAt: new Date() }
    })

    await approvals.updateOne(
      { event_id: eventId },
      {
        $set: {
          vc_status: 'approved',
          vc_comment: 'Approved by VC',
          vc_approved_at: new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    )

    await aiData.updateOne(
      { event_id: eventId },
      {
        $set: { approval_stage: 'published', updatedAt: new Date() },
      }
    )

    console.log('Event fully approved and published!')

    // Check final status
    const finalEvent = await events.findOne({ _id: eventId })
    console.log('Final event status:', finalEvent.status)

  } finally {
    await client.close()
  }
}

approveEvent().catch(console.error)