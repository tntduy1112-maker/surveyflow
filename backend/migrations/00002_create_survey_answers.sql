-- +goose Up
CREATE TABLE survey_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    answer      JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX idx_answers_session_id ON survey_answers(session_id);

-- +goose Down
DROP TABLE IF EXISTS survey_answers;
