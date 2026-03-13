import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { Pool } = require('pg')

let poolInstance

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
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

  await pool.query('CREATE INDEX IF NOT EXISTS registrations_student_id_idx ON registrations(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON registrations(event_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS attendance_student_id_idx ON attendance(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS attendance_event_id_idx ON attendance(event_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS certificates_student_id_idx ON certificates(student_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS certificates_event_id_idx ON certificates(event_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id)')
}

export { getPool }
