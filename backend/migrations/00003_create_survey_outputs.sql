-- +goose Up
CREATE TABLE survey_outputs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
    brief_text       TEXT,
    product_spec     TEXT,
    user_stories     TEXT,
    deployment_plan  TEXT,
    test_cases       TEXT,
    generation_error TEXT,
    generated_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_session_output UNIQUE (session_id)
);

CREATE INDEX idx_outputs_session_id ON survey_outputs(session_id);

-- +goose Down
DROP TABLE IF EXISTS survey_outputs;
