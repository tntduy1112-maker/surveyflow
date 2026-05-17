package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/productcon/survey-agent/pkg/apperror"
)

type SuccessResponse struct {
	Success bool   `json:"success"`
	Data    any    `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

type ErrorResponse struct {
	Success bool              `json:"success"`
	Error   ErrorResponseBody `json:"error"`
}

type ErrorResponseBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Data       any            `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, SuccessResponse{Success: true, Data: data})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, SuccessResponse{Success: true, Data: data})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func OKWithMessage(c *gin.Context, data any, message string) {
	c.JSON(http.StatusOK, SuccessResponse{Success: true, Data: data, Message: message})
}

func Paginated(c *gin.Context, data any, pagination PaginationMeta) {
	c.JSON(http.StatusOK, PaginatedResponse{Success: true, Data: data, Pagination: pagination})
}

func Error(c *gin.Context, err *apperror.AppError) {
	c.AbortWithStatusJSON(err.StatusCode, ErrorResponse{
		Success: false,
		Error: ErrorResponseBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
	})
}

func InternalError(c *gin.Context) {
	Error(c, apperror.ErrInternal)
}
