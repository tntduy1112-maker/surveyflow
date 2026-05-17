package middleware

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/productcon/survey-agent/internal/dto/response"
	"github.com/productcon/survey-agent/pkg/apperror"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last().Err

		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			response.Error(c, appErr)
			return
		}

		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "An unexpected error occurred",
			},
		})
	}
}
