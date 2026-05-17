package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/productcon/survey-agent/internal/domain"
)

type SurveyRepository interface {
	CreateSession(ctx context.Context) (*domain.SurveySession, error)
	GetSession(ctx context.Context, id uuid.UUID) (*domain.SurveySession, error)
	UpdateSessionStep(ctx context.Context, id uuid.UUID, currentStep, totalSteps int) error
	UpdateSessionStatus(ctx context.Context, id uuid.UUID, status domain.SessionStatus) error
	UpdateDetailLevel(ctx context.Context, id uuid.UUID, level string) error
	UpdateSessionEmail(ctx context.Context, id uuid.UUID, email string) error
	UpsertAnswer(ctx context.Context, sessionID uuid.UUID, questionID string, answer map[string]interface{}) error
	GetAnswers(ctx context.Context, sessionID uuid.UUID) ([]domain.SurveyAnswer, error)
	CreateOutput(ctx context.Context, output *domain.SurveyOutput) error
	GetOutput(ctx context.Context, sessionID uuid.UUID) (*domain.SurveyOutput, error)
}
