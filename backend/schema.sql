
-- ==============================
-- 1. REGISTRATIONS TABLE
-- ==============================
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
);

CREATE INDEX IF NOT EXISTS registrations_student_id_idx 
ON registrations(student_id);

CREATE INDEX IF NOT EXISTS registrations_event_id_idx 
ON registrations(event_id);


-- ==============================
-- 2. ATTENDANCE TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_student_event_unique UNIQUE (student_id, event_id)
);

CREATE INDEX IF NOT EXISTS attendance_student_id_idx 
ON attendance(student_id);

CREATE INDEX IF NOT EXISTS attendance_event_id_idx 
ON attendance(event_id);


-- ==============================
-- 3. CERTIFICATES TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    certificate_url TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificates_student_event_unique UNIQUE (student_id, event_id)
);

CREATE INDEX IF NOT EXISTS certificates_student_id_idx 
ON certificates(student_id);

CREATE INDEX IF NOT EXISTS certificates_event_id_idx 
ON certificates(event_id);


-- ==============================
-- 4. NOTIFICATIONS TABLE
-- ==============================
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
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx 
ON notifications(user_id);


-- ==============================
-- 5. CERTIFICATE TEMPLATES TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE,
    template_name VARCHAR(255),
    image_url TEXT NOT NULL,
    settings JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_event_id_unique_idx 
ON certificate_templates(event_id);