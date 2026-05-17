package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/productcon/survey-agent/internal/dto/request"
	"github.com/productcon/survey-agent/internal/dto/response"
	"github.com/productcon/survey-agent/internal/service"
	"github.com/productcon/survey-agent/pkg/apperror"
)

type SurveyHandler struct {
	svc *service.SurveyService
}

func NewSurveyHandler(svc *service.SurveyService) *SurveyHandler {
	return &SurveyHandler{svc: svc}
}

func (h *SurveyHandler) CreateSession(c *gin.Context) {
	session, err := h.svc.CreateSession(c.Request.Context())
	if err != nil {
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.Created(c, response.CreateSessionResponse{SessionID: session.ID.String()})
}

func (h *SurveyHandler) SaveAnswer(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.ErrBadRequest)
		return
	}
	var req request.SaveAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(apperror.WithDetails(apperror.ErrValidation, err.Error()))
		return
	}
	if err := h.svc.SaveAnswer(
		c.Request.Context(), sessionID,
		req.QuestionID, req.Answer, req.CurrentStep, req.TotalSteps,
	); err != nil {
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.OK(c, response.SaveAnswerResponse{
		SessionID: sessionID.String(), CurrentStep: req.CurrentStep,
	})
}

func (h *SurveyHandler) GetSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.ErrBadRequest)
		return
	}
	session, answers, err := h.svc.GetSession(c.Request.Context(), sessionID)
	if err != nil {
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	if session == nil {
		response.Error(c, apperror.ErrSessionNotFound)
		return
	}
	response.OK(c, response.GetSessionResponse{
		SessionID: session.ID.String(), Status: string(session.Status),
		DetailLevel: session.DetailLevel, CurrentStep: session.CurrentStep,
		TotalSteps: session.TotalSteps, Answers: answers,
	})
}

func (h *SurveyHandler) Submit(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.ErrBadRequest)
		return
	}
	output, err := h.svc.Submit(c.Request.Context(), sessionID)
	if err != nil {
		if output != nil && output.BriefText != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"data":    response.GetOutputResponse{BriefText: output.BriefText},
				"error":   gin.H{"code": "GENERATION_PARTIAL", "message": err.Error()},
			})
			return
		}
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.OK(c, response.GetOutputResponse{
		BriefText: output.BriefText, ProductSpec: output.ProductSpec,
		UserStories: output.UserStories, DeploymentPlan: output.DeploymentPlan,
		TestCases: output.TestCases,
	})
}

func (h *SurveyHandler) GetOutput(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.ErrBadRequest)
		return
	}
	output, err := h.svc.GetOutput(c.Request.Context(), sessionID)
	if err != nil {
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	if output == nil {
		response.Error(c, apperror.ErrNotFound)
		return
	}
	response.OK(c, response.GetOutputResponse{
		BriefText: output.BriefText, ProductSpec: output.ProductSpec,
		UserStories: output.UserStories, DeploymentPlan: output.DeploymentPlan,
		TestCases: output.TestCases,
	})
}

func (h *SurveyHandler) SendEmail(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "coming in slice 7"})
}
