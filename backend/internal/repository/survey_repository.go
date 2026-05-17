package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/productcon/survey-agent/internal/domain"
)

type surveyRepo struct {
	db *pgxpool.Pool
}

func NewSurveyRepository(db *pgxpool.Pool) SurveyRepository {
	return &surveyRepo{db: db}
}

func (r *surveyRepo) CreateSession(ctx context.Context) (*domain.SurveySession, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO survey_sessions (status, current_step, total_steps, started_at, created_at, updated_at)
		VALUES ('in_progress', 0, 11, NOW(), NOW(), NOW())
		RETURNING id, COALESCE(detail_level,''), status, email,
		          current_step, total_steps, started_at, submitted_at, completed_at, created_at, updated_at
	`)
	return scanSession(row)
}

func (r *surveyRepo) GetSession(ctx context.Context, id uuid.UUID) (*domain.SurveySession, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, COALESCE(detail_level,''), status, email,
		       current_step, total_steps, started_at, submitted_at, completed_at, created_at, updated_at
		FROM survey_sessions WHERE id = $1
	`, id)
	s, err := scanSession(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return s, err
}

func (r *surveyRepo) UpdateSessionStep(ctx context.Context, id uuid.UUID, currentStep, totalSteps int) error {
	_, err := r.db.Exec(ctx, `
		UPDATE survey_sessions
		SET current_step = $1, total_steps = $2, updated_at = NOW()
		WHERE id = $3
	`, currentStep, totalSteps, id)
	return err
}

func (r *surveyRepo) UpdateSessionStatus(ctx context.Context, id uuid.UUID, status domain.SessionStatus) error {
	_, err := r.db.Exec(ctx, `
		UPDATE survey_sessions SET status = $1, updated_at = NOW() WHERE id = $2
	`, string(status), id)
	return err
}

func (r *surveyRepo) UpsertAnswer(ctx context.Context, sessionID uuid.UUID, questionID string, answer map[string]interface{}) error {
	answerJSON, err := json.Marshal(answer)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(ctx, `
		INSERT INTO survey_answers (session_id, question_id, answer, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (session_id, question_id)
		DO UPDATE SET answer = EXCLUDED.answer, updated_at = NOW()
	`, sessionID, questionID, answerJSON)
	return err
}

func (r *surveyRepo) GetAnswers(ctx context.Context, sessionID uuid.UUID) ([]domain.SurveyAnswer, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, session_id, question_id, answer, created_at, updated_at
		FROM survey_answers WHERE session_id = $1
		ORDER BY created_at ASC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.SurveyAnswer
	for rows.Next() {
		var a domain.SurveyAnswer
		var rawAnswer []byte
		if err := rows.Scan(&a.ID, &a.SessionID, &a.QuestionID, &rawAnswer, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(rawAnswer, &a.Answer); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *surveyRepo) CreateOutput(ctx context.Context, output *domain.SurveyOutput) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO survey_outputs
		  (session_id, brief_text, product_spec, user_stories, deployment_plan, test_cases, generation_error, generated_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
		ON CONFLICT (session_id) DO UPDATE SET
		  brief_text = EXCLUDED.brief_text, product_spec = EXCLUDED.product_spec,
		  user_stories = EXCLUDED.user_stories, deployment_plan = EXCLUDED.deployment_plan,
		  test_cases = EXCLUDED.test_cases, generation_error = EXCLUDED.generation_error,
		  generated_at = EXCLUDED.generated_at, updated_at = NOW()
	`, output.SessionID, output.BriefText, output.ProductSpec, output.UserStories,
		output.DeploymentPlan, output.TestCases, output.GenerationError, output.GeneratedAt)
	return err
}

func (r *surveyRepo) GetOutput(ctx context.Context, sessionID uuid.UUID) (*domain.SurveyOutput, error) {
	var o domain.SurveyOutput
	err := r.db.QueryRow(ctx, `
		SELECT id, session_id, brief_text, product_spec, user_stories, deployment_plan,
		       test_cases, generation_error, generated_at, created_at, updated_at
		FROM survey_outputs WHERE session_id = $1
	`, sessionID).Scan(
		&o.ID, &o.SessionID, &o.BriefText, &o.ProductSpec, &o.UserStories,
		&o.DeploymentPlan, &o.TestCases, &o.GenerationError, &o.GeneratedAt,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *surveyRepo) UpdateSessionEmail(ctx context.Context, id uuid.UUID, email string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE survey_sessions SET email = $1, updated_at = NOW() WHERE id = $2
	`, email, id)
	return err
}

func scanSession(row pgx.Row) (*domain.SurveySession, error) {
	var s domain.SurveySession
	err := row.Scan(
		&s.ID, &s.DetailLevel, &s.Status, &s.Email,
		&s.CurrentStep, &s.TotalSteps,
		&s.StartedAt, &s.SubmittedAt, &s.CompletedAt,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *surveyRepo) UpdateDetailLevel(ctx context.Context, id uuid.UUID, level string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE survey_sessions SET detail_level = $1, updated_at = NOW() WHERE id = $2
	`, level, id)
	return err
}
