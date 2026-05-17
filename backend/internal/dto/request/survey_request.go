package request

type SaveAnswerRequest struct {
	QuestionID  string                 `json:"question_id"  binding:"required"`
	Answer      map[string]interface{} `json:"answer"       binding:"required"`
	CurrentStep int                    `json:"current_step"`
	TotalSteps  int                    `json:"total_steps"`
}

type SubmitSurveyRequest struct {
	DetailLevel string `json:"detail_level" binding:"required,oneof=rough some detailed"`
	Answers     []struct {
		QuestionID string                 `json:"question_id" binding:"required"`
		Answer     map[string]interface{} `json:"answer"      binding:"required"`
	} `json:"answers" binding:"required"`
}

type SendEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}
