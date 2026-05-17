package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/productcon/survey-agent/internal/dto/response"
	"github.com/productcon/survey-agent/pkg/apperror"
	"github.com/productcon/survey-agent/pkg/cache"
)

// RateLimit returns a middleware that limits requests to maxRequests per window duration.
// It uses Redis to track request counts keyed by client IP + route.
func RateLimit(redis *cache.RedisClient, maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		route := c.FullPath()
		key := fmt.Sprintf("ratelimit:%s:%s", route, ip)

		ctx := context.Background()

		count, err := redis.Incr(ctx, key)
		if err != nil {
			// Allow request if Redis is unavailable
			c.Next()
			return
		}

		if count == 1 {
			_ = redis.Expire(ctx, key, window)
		}

		if count > int64(maxRequests) {
			response.Error(c, apperror.ErrTooManyRequests)
			return
		}

		c.Next()
	}
}
