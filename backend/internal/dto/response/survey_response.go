package response

import "github.com/productcon/survey-agent/internal/domain"

type CreateSessionResponse struct {
	SessionID string `json:"session_id"`
}

type SaveAnswerResponse struct {
	SessionID   string `json:"session_id"`
	CurrentStep int    `json:"current_step"`
}

type GetSessionResponse struct {
	SessionID   string                `json:"session_id"`
	Status      string                `json:"status"`
	DetailLevel string                `json:"detail_level"`
	CurrentStep int                   `json:"current_step"`
	TotalSteps  int                   `json:"total_steps"`
	Answers     []domain.SurveyAnswer `json:"answers"`
}

type GetOutputResponse struct {
	BriefText      *string `json:"brief_text"`
	ProductSpec    *string `json:"product_spec"`
	UserStories    *string `json:"user_stories"`
	DeploymentPlan *string `json:"deployment_plan"`
	TestCases      *string `json:"test_cases"`
}
