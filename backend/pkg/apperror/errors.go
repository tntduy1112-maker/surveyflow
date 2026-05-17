package apperror

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
	Details    any    `json:"details,omitempty"`
}

func (e *AppError) Error() string { return e.Message }

func New(code, message string, statusCode int) *AppError {
	return &AppError{Code: code, Message: message, StatusCode: statusCode}
}

func WithDetails(err *AppError, details any) *AppError {
	return &AppError{Code: err.Code, Message: err.Message, StatusCode: err.StatusCode, Details: details}
}

func Wrap(err error, appErr *AppError) *AppError {
	return &AppError{Code: appErr.Code, Message: fmt.Sprintf("%s: %v", appErr.Message, err), StatusCode: appErr.StatusCode}
}

var (
	ErrBadRequest       = &AppError{Code: "BAD_REQUEST", Message: "Bad request", StatusCode: http.StatusBadRequest}
	ErrNotFound         = &AppError{Code: "NOT_FOUND", Message: "Resource not found", StatusCode: http.StatusNotFound}
	ErrConflict         = &AppError{Code: "CONFLICT", Message: "Resource already exists", StatusCode: http.StatusConflict}
	ErrValidation       = &AppError{Code: "VALIDATION_ERROR", Message: "Validation failed", StatusCode: http.StatusUnprocessableEntity}
	ErrInternal         = &AppError{Code: "INTERNAL_ERROR", Message: "Internal server error", StatusCode: http.StatusInternalServerError}
	ErrTooManyRequests  = &AppError{Code: "TOO_MANY_REQUESTS", Message: "Too many requests", StatusCode: http.StatusTooManyRequests}
	ErrSessionNotFound  = &AppError{Code: "SESSION_NOT_FOUND", Message: "Survey session not found", StatusCode: http.StatusNotFound}
	ErrAlreadySubmitted = &AppError{Code: "ALREADY_SUBMITTED", Message: "Session already submitted", StatusCode: http.StatusConflict}
)
