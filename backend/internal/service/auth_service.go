package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/productcon/survey-agent/internal/config"
	"github.com/productcon/survey-agent/internal/domain"
	"github.com/productcon/survey-agent/internal/repository"
	"github.com/productcon/survey-agent/pkg/apperror"
	"github.com/productcon/survey-agent/pkg/jwtutil"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo *repository.AuthRepository
	cfg  config.JWTConfig
}

func NewAuthService(repo *repository.AuthRepository, cfg config.JWTConfig) *AuthService {
	return &AuthService{repo: repo, cfg: cfg}
}

type TokenPair struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         *domain.User `json:"user"`
}

func (s *AuthService) Register(ctx context.Context, email, password, name string) (*TokenPair, error) {
	existing, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}
	if existing != nil {
		return nil, apperror.ErrConflict
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}

	user, err := s.repo.CreateUser(ctx, email, string(hash), name)
	if err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}
	return s.issueTokens(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}
	if user == nil {
		return nil, apperror.ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return nil, apperror.ErrInvalidCredentials
	}
	return s.issueTokens(ctx, user)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*TokenPair, error) {
	user, err := s.repo.GetUserByRefreshToken(ctx, refreshToken)
	if err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}
	if user == nil {
		return nil, apperror.ErrInvalidToken
	}
	// Rotate: delete old, issue new
	_ = s.repo.DeleteRefreshToken(ctx, refreshToken)
	return s.issueTokens(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	return s.repo.DeleteRefreshToken(ctx, refreshToken)
}

func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *AuthService) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]map[string]interface{}, error) {
	return s.repo.GetUserSessions(ctx, userID)
}

func (s *AuthService) LinkSession(ctx context.Context, sessionID, userID uuid.UUID) error {
	return s.repo.LinkSessionToUser(ctx, sessionID, userID)
}

func (s *AuthService) issueTokens(ctx context.Context, user *domain.User) (*TokenPair, error) {
	access, err := jwtutil.GenerateAccessToken(user.ID, user.Email, s.cfg.AccessSecret, s.cfg.AccessTTL)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}
	refresh, err := jwtutil.GenerateRefreshToken(user.ID, s.cfg.RefreshSecret, s.cfg.RefreshTTL)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}
	if err := s.repo.SaveRefreshToken(ctx, user.ID, refresh, s.cfg.RefreshTTL); err != nil {
		return nil, apperror.Wrap(err, apperror.ErrInternal)
	}
	return &TokenPair{AccessToken: access, RefreshToken: refresh, User: user}, nil
}
