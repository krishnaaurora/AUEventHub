import { createRequire } from 'module'
import { newDb } from 'pg-mem'
import { DEMO_SQL_SEED } from './mock-store'

const require = createRequire(import.meta.url)
let RealPgPool = null

try {
  const pg = require('pg')
  RealPgPool = pg.Pool
} catch {
  RealPgPool = null
}

let poolInstance
let memoryDb

function isMemoryDatabase() {
  return !process.env.DATABASE_URL
}

function getPool() {
  if (!poolInstance) {
    if (process.env.DATABASE_URL) {
      if (!RealPgPool) {
        throw new Error('DATABASE_URL is set but the "pg" package is not available in this runtime.')
      }
      poolInstance = new RealPgPool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
      })
    } else {
      if (!globalThis.__aiEventMangPgMemDb) {
        globalThis.__aiEventMangPgMemDb = newDb()
        const adapter = globalThis.__aiEventMangPgMemDb.adapters.createPg()
        globalThis.__aiEventMangPgMemPool = new adapter.Pool()
      }
      memoryDb = globalThis.__aiEventMangPgMemDb
      poolInstance = globalThis.__aiEventMangPgMemPool
    }
  }
  return poolInstance
}

export async function pingPostgres() {
  const pool = getPool()
  const result = await pool.query('SELECT 1 AS ok')
  return result?.rows?.[0]?.ok === 1
}

export async function ensureStudentTransactionTables() {
  const pool = getPool()

  if (isMemoryDatabase()) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL,
        student_id TEXT,
        event_id TEXT,
        ticket_id TEXT,
        qr_code TEXT,
        registration_date TIMESTAMP,
        registered_at TIMESTAMP,
        status TEXT
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL,
        student_id TEXT,
        event_id TEXT,
        status TEXT,
        scanned_at TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL,
        student_id TEXT,
        event_id TEXT,
        certificate_url TEXT,
        issued_at TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL,
        user_id TEXT,
        type TEXT,
        title TEXT,
        message TEXT,
        event_id TEXT,
        priority TEXT,
        is_read BOOLEAN,
        created_at TIMESTAMP
      )
    `)
  } else {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        ticket_id VARCHAR(100) NOT NULL UNIQUE,
        qr_code TEXT,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'confirmed',
        CONSTRAINT registrations_student_event_unique UNIQUE (student_id, event_id)
      )
    `)

    // Add qr_code column if missing (safe migration)
    await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS qr_code TEXT`).catch(() => {})
    await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {})
    await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed'`).catch(() => {})

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT attendance_student_event_unique UNIQUE (student_id, event_id)
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        certificate_url TEXT NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT certificates_student_event_unique UNIQUE (student_id, event_id)
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        type VARCHAR(100) DEFAULT 'info',
        title VARCHAR(255),
        message TEXT NOT NULL,
        event_id VARCHAR(100),
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Safe migrations for existing notifications table
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'info'`).catch(() => {})
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255)`).catch(() => {})
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id VARCHAR(100)`).catch(() => {})
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`).catch(() => {})
  }

  await pool.query('CREATE INDEX IF NOT EXISTS registrations_student_id_idx ON registrations(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON registrations(event_id)')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS registrations_student_event_unique_idx ON registrations(student_id, event_id)')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS registrations_ticket_id_unique_idx ON registrations(ticket_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS attendance_student_id_idx ON attendance(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS attendance_event_id_idx ON attendance(event_id)')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_event_unique_idx ON attendance(student_id, event_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS certificates_student_id_idx ON certificates(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS certificates_event_id_idx ON certificates(event_id)')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS certificates_student_event_unique_idx ON certificates(student_id, event_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id)')

  if (isMemoryDatabase()) {
    const registrationCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM registrations')
    if (registrationCountResult.rows[0].count === 0) {
      for (const row of DEMO_SQL_SEED.registrations) {
        await pool.query(
          `INSERT INTO registrations (student_id, event_id, ticket_id, qr_code, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (student_id, event_id) DO NOTHING`,
          row,
        )
      }
    }

    const attendanceCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM attendance')
    if (attendanceCountResult.rows[0].count === 0) {
      for (const row of DEMO_SQL_SEED.attendance) {
        await pool.query(
          `INSERT INTO attendance (student_id, event_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, event_id)
           DO UPDATE SET status = EXCLUDED.status, scanned_at = CURRENT_TIMESTAMP`,
          row,
        )
      }
    }

    const certificateCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM certificates')
    if (certificateCountResult.rows[0].count === 0) {
      for (const row of DEMO_SQL_SEED.certificates) {
        await pool.query(
          `INSERT INTO certificates (student_id, event_id, certificate_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, event_id)
           DO UPDATE SET certificate_url = EXCLUDED.certificate_url, issued_at = CURRENT_TIMESTAMP`,
          row,
        )
      }
    }

    const notificationCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM notifications')
    if (notificationCountResult.rows[0].count === 0) {
      for (const row of DEMO_SQL_SEED.notifications) {
        await pool.query(
          `INSERT INTO notifications (user_id, message, priority)
           VALUES ($1, $2, $3)`,
          row,
        )
      }
    }
  }
}

export { getPool }
