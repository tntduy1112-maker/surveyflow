-- +goose Up
CREATE TYPE session_status AS ENUM ('in_progress', 'submitted', 'completed', 'failed');

CREATE TABLE survey_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detail_level    VARCHAR(20) CHECK (detail_level IN ('rough', 'some', 'detailed')),
    status          session_status NOT NULL DEFAULT 'in_progress',
    email           VARCHAR(255),
    current_step    SMALLINT NOT NULL DEFAULT 0,
    total_steps     SMALLINT NOT NULL DEFAULT 11,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_status ON survey_sessions(status);
CREATE INDEX idx_sessions_email  ON survey_sessions(email) WHERE email IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS survey_sessions;
DROP TYPE IF EXISTS session_status;
