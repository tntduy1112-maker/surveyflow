package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/productcon/survey-agent/internal/dto/response"
	"github.com/productcon/survey-agent/internal/middleware"
	"github.com/productcon/survey-agent/internal/service"
	"github.com/productcon/survey-agent/pkg/apperror"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Name     string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(apperror.WithDetails(apperror.ErrValidation, err.Error()))
		return
	}
	pair, err := h.svc.Register(c.Request.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		_ = c.Error(err.(*apperror.AppError))
		return
	}
	response.Created(c, pair)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(apperror.WithDetails(apperror.ErrValidation, err.Error()))
		return
	}
	pair, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(c, appErr)
			return
		}
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.OK(c, pair)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(apperror.WithDetails(apperror.ErrValidation, err.Error()))
		return
	}
	pair, err := h.svc.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(c, appErr)
			return
		}
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.OK(c, pair)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.RefreshToken != "" {
		_ = h.svc.Logout(c.Request.Context(), req.RefreshToken)
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Error(c, apperror.ErrUnauthorized)
		return
	}
	user, err := h.svc.GetUserByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		response.Error(c, apperror.ErrNotFound)
		return
	}
	response.OK(c, user)
}

func (h *AuthHandler) MySessions(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Error(c, apperror.ErrUnauthorized)
		return
	}
	sessions, err := h.svc.GetUserSessions(c.Request.Context(), userID)
	if err != nil {
		_ = c.Error(apperror.Wrap(err, apperror.ErrInternal))
		return
	}
	response.OK(c, sessions)
}
