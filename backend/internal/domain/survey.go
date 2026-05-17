package domain

import (
	"time"

	"github.com/google/uuid"
)

type SessionStatus string

const (
	StatusInProgress SessionStatus = "in_progress"
	StatusSubmitted  SessionStatus = "submitted"
	StatusCompleted  SessionStatus = "completed"
	StatusFailed     SessionStatus = "failed"
)

type SurveySession struct {
	ID          uuid.UUID     `json:"id"`
	DetailLevel string        `json:"detail_level"`
	Status      SessionStatus `json:"status"`
	Email       *string       `json:"email,omitempty"`
	CurrentStep int           `json:"current_step"`
	TotalSteps  int           `json:"total_steps"`
	StartedAt   time.Time     `json:"started_at"`
	SubmittedAt *time.Time    `json:"submitted_at,omitempty"`
	CompletedAt *time.Time    `json:"completed_at,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

type SurveyAnswer struct {
	ID         uuid.UUID              `json:"id"`
	SessionID  uuid.UUID              `json:"session_id"`
	QuestionID string                 `json:"question_id"`
	Answer     map[string]interface{} `json:"answer"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

type SurveyOutput struct {
	ID              uuid.UUID  `json:"id"`
	SessionID       uuid.UUID  `json:"session_id"`
	BriefText       *string    `json:"brief_text,omitempty"`
	ProductSpec     *string    `json:"product_spec,omitempty"`
	UserStories     *string    `json:"user_stories,omitempty"`
	DeploymentPlan  *string    `json:"deployment_plan,omitempty"`
	TestCases       *string    `json:"test_cases,omitempty"`
	GenerationError *string    `json:"generation_error,omitempty"`
	GeneratedAt     *time.Time `json:"generated_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
