package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/productcon/survey-agent/internal/domain"
)

type AuthRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateUser(ctx context.Context, email, passwordHash, name string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, name, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, email, password_hash, COALESCE(name,''), is_active, created_at, updated_at
	`, email, passwordHash, name).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	return &u, err
}

func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, COALESCE(name,''), is_active, created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *AuthRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, COALESCE(name,''), is_active, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func (r *AuthRepository) SaveRefreshToken(ctx context.Context, userID uuid.UUID, token string, ttlDays int) error {
	hash := hashToken(token)
	exp := time.Now().Add(time.Duration(ttlDays) * 24 * time.Hour)
	_, err := r.db.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
	`, userID, hash, exp)
	return err
}

func (r *AuthRepository) GetUserByRefreshToken(ctx context.Context, token string) (*domain.User, error) {
	hash := hashToken(token)
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT u.id, u.email, u.password_hash, COALESCE(u.name,''), u.is_active, u.created_at, u.updated_at
		FROM refresh_tokens rt
		JOIN users u ON u.id = rt.user_id
		WHERE rt.token_hash = $1 AND rt.expires_at > NOW()
	`, hash).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *AuthRepository) DeleteRefreshToken(ctx context.Context, token string) error {
	hash := hashToken(token)
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE token_hash = $1`, hash)
	return err
}

func (r *AuthRepository) DeleteAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}

// LinkSessionToUser sets user_id on a survey session
func (r *AuthRepository) LinkSessionToUser(ctx context.Context, sessionID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE survey_sessions SET user_id = $1, updated_at = NOW() WHERE id = $2
	`, userID, sessionID)
	return err
}

// GetUserSessions returns all sessions belonging to a user that have output
func (r *AuthRepository) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]map[string]interface{}, error) {
	rows, err := r.db.Query(ctx, `
		SELECT s.id, s.detail_level, s.status, s.current_step, s.total_steps,
		       s.created_at, s.completed_at,
		       a.answer->>'app_name' AS app_name
		FROM survey_sessions s
		LEFT JOIN survey_answers a ON a.session_id = s.id AND a.question_id = 'app_identity'
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []map[string]interface{}
	for rows.Next() {
		var id, detailLevel, status string
		var currentStep, totalSteps int
		var createdAt time.Time
		var completedAt *time.Time
		var appName *string

		if err := rows.Scan(&id, &detailLevel, &status, &currentStep, &totalSteps,
			&createdAt, &completedAt, &appName); err != nil {
			return nil, err
		}
		m := map[string]interface{}{
			"id": id, "detail_level": detailLevel, "status": status,
			"current_step": currentStep, "total_steps": totalSteps,
			"created_at": createdAt, "completed_at": completedAt,
			"app_name": appName,
		}
		out = append(out, m)
	}
	return out, rows.Err()
}
