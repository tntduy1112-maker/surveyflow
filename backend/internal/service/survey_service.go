package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/productcon/survey-agent/internal/domain"
	"github.com/productcon/survey-agent/internal/repository"
)

var detailLevelTotals = map[string]int{
	"rough": 11, "some": 14, "detailed": 15,
}

type SurveyService struct {
	repo      repository.SurveyRepository
	claudeSvc *ClaudeService
}

func NewSurveyService(repo repository.SurveyRepository, claudeSvc *ClaudeService) *SurveyService {
	return &SurveyService{repo: repo, claudeSvc: claudeSvc}
}

func (s *SurveyService) CreateSession(ctx context.Context) (*domain.SurveySession, error) {
	return s.repo.CreateSession(ctx)
}

func (s *SurveyService) SaveAnswer(
	ctx context.Context,
	sessionID uuid.UUID,
	questionID string,
	answer map[string]interface{},
	currentStep, totalSteps int,
) error {
	if err := s.repo.UpsertAnswer(ctx, sessionID, questionID, answer); err != nil {
		return err
	}
	if questionID == "detail_level" {
		if val, ok := answer["value"].(string); ok {
			if err := s.repo.UpdateDetailLevel(ctx, sessionID, val); err != nil {
				return err
			}
			if t, exists := detailLevelTotals[val]; exists {
				totalSteps = t
			}
		}
	}
	return s.repo.UpdateSessionStep(ctx, sessionID, currentStep, totalSteps)
}

func (s *SurveyService) GetSession(
	ctx context.Context, sessionID uuid.UUID,
) (*domain.SurveySession, []domain.SurveyAnswer, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil || session == nil {
		return nil, nil, err
	}
	answers, err := s.repo.GetAnswers(ctx, sessionID)
	return session, answers, err
}

func (s *SurveyService) Submit(ctx context.Context, sessionID uuid.UUID) (*domain.SurveyOutput, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, fmt.Errorf("session not found")
	}
	if session.Status == domain.StatusCompleted {
		// Already generated — return cached output
		return s.repo.GetOutput(ctx, sessionID)
	}
	if session.Status == domain.StatusSubmitted {
		return nil, fmt.Errorf("generation already in progress")
	}

	// Mark submitted
	if err := s.repo.UpdateSessionStatus(ctx, sessionID, domain.StatusSubmitted); err != nil {
		return nil, err
	}

	// Load all answers from DB
	answers, err := s.repo.GetAnswers(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	// Generate plain-text brief
	brief := GenerateBrief(answers)

	// Call Claude API (4 parallel calls)
	docs, claudeErr := s.claudeSvc.GenerateDocuments(ctx, brief)

	// Store output regardless of error so partial results are preserved
	now := time.Now()
	output := &domain.SurveyOutput{
		SessionID: sessionID,
		BriefText: &brief,
		GeneratedAt: &now,
	}

	if claudeErr != nil {
		errMsg := claudeErr.Error()
		output.GenerationError = &errMsg
		_ = s.repo.UpdateSessionStatus(ctx, sessionID, domain.StatusFailed)
	} else {
		output.ProductSpec    = &docs.Spec
		output.UserStories    = &docs.Stories
		output.DeploymentPlan = &docs.DeploymentPlan
		output.TestCases      = &docs.TestCases
		_ = s.repo.UpdateSessionStatus(ctx, sessionID, domain.StatusCompleted)
	}

	if err := s.repo.CreateOutput(ctx, output); err != nil {
		return nil, err
	}

	if claudeErr != nil {
		return output, claudeErr
	}
	return output, nil
}

func (s *SurveyService) GetOutput(ctx context.Context, sessionID uuid.UUID) (*domain.SurveyOutput, error) {
	return s.repo.GetOutput(ctx, sessionID)
}
