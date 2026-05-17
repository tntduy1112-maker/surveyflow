package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/productcon/survey-agent/internal/config"
	"github.com/productcon/survey-agent/internal/handler"
	"github.com/productcon/survey-agent/internal/middleware"
	"github.com/productcon/survey-agent/internal/repository"
	"github.com/productcon/survey-agent/internal/service"
	"github.com/productcon/survey-agent/pkg/cache"
	"github.com/productcon/survey-agent/pkg/database"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}

	pool, err := database.NewPostgresPool(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to postgres")
	}
	defer pool.Close()
	log.Info().Msg("postgres connected")

	redisClient, err := cache.NewRedisClient(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to redis")
	}
	defer redisClient.Close()
	log.Info().Msg("redis connected")

	// Wire layers
	surveyRepo := repository.NewSurveyRepository(pool)
	claudeSvc  := service.NewClaudeService(cfg.Anthropic.APIKey, cfg.Anthropic.Model)
	surveySvc  := service.NewSurveyService(surveyRepo, claudeSvc)
	surveyH    := handler.NewSurveyHandler(surveySvc)

	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.App.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": cfg.App.Name, "env": cfg.App.Env})
	})

	v1 := r.Group("/api/v1")
	sessions := v1.Group("/sessions")
	{
		sessions.POST("",
			middleware.RateLimit(redisClient, 20, time.Hour),
			surveyH.CreateSession,
		)
		sessions.GET("/:id", surveyH.GetSession)
		sessions.PATCH("/:id/answers", surveyH.SaveAnswer)
		sessions.POST("/:id/submit",
			middleware.RateLimit(redisClient, 5, time.Hour),
			surveyH.Submit,
		)
		sessions.GET("/:id/output", surveyH.GetOutput)
		sessions.POST("/:id/email", surveyH.SendEmail)
	}

	srv := &http.Server{
		Addr:    ":" + cfg.App.Port,
		Handler: r,
		// WriteTimeout raised to 120s: Submit blocks while Claude generates 4 docs
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info().Str("port", cfg.App.Port).Msg("server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("forced shutdown")
	}
	log.Info().Msg("server exited")
}
