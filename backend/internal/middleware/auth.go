package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/productcon/survey-agent/internal/dto/response"
	"github.com/productcon/survey-agent/pkg/apperror"
	"github.com/productcon/survey-agent/pkg/jwtutil"
)

const userIDKey = "user_id"
const userEmailKey = "user_email"

func Auth(accessSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, apperror.ErrUnauthorized)
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtutil.ParseAccessToken(token, accessSecret)
		if err != nil {
			response.Error(c, apperror.ErrInvalidToken)
			return
		}
		c.Set(userIDKey, claims.UserID)
		c.Set(userEmailKey, claims.Email)
		c.Next()
	}
}

// OptionalAuth parses the token if present but does not abort if missing.
func OptionalAuth(accessSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			token := strings.TrimPrefix(header, "Bearer ")
			if claims, err := jwtutil.ParseAccessToken(token, accessSecret); err == nil {
				c.Set(userIDKey, claims.UserID)
				c.Set(userEmailKey, claims.Email)
			}
		}
		c.Next()
	}
}

func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	v, exists := c.Get(userIDKey)
	if !exists {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(v.(string))
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}
