package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	App       AppConfig
	Database  DatabaseConfig
	Redis     RedisConfig
	Anthropic AnthropicConfig
	SMTP      SMTPConfig
}

type AppConfig struct {
	Name        string
	Env         string
	Port        string
	URL         string
	FrontendURL string
}

type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	PoolMin  int
	PoolMax  int
}

func (c DatabaseConfig) DSN() string {
	if c.URL != "" {
		return c.URL
	}
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode)
}

type RedisConfig struct {
	URL      string
	Host     string
	Port     string
	Password string
	DB       int
}

func (c RedisConfig) Addr() string { return fmt.Sprintf("%s:%s", c.Host, c.Port) }

type AnthropicConfig struct {
	APIKey string
	Model  string
}

type SMTPConfig struct {
	Host string
	Port int
	User string
	Pass string
	From string
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	_ = viper.ReadInConfig()
	setDefaults()

	cfg := &Config{
		App: AppConfig{
			Name:        viper.GetString("APP_NAME"),
			Env:         viper.GetString("APP_ENV"),
			Port:        viper.GetString("APP_PORT"),
			URL:         viper.GetString("APP_URL"),
			FrontendURL: viper.GetString("FRONTEND_URL"),
		},
		Database: DatabaseConfig{
			URL:      viper.GetString("DATABASE_URL"),
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetString("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			Name:     viper.GetString("DB_NAME"),
			SSLMode:  viper.GetString("DB_SSLMODE"),
			PoolMin:  viper.GetInt("DB_POOL_MIN"),
			PoolMax:  viper.GetInt("DB_POOL_MAX"),
		},
		Redis: RedisConfig{
			URL:      viper.GetString("REDIS_URL"),
			Host:     viper.GetString("REDIS_HOST"),
			Port:     viper.GetString("REDIS_PORT"),
			Password: viper.GetString("REDIS_PASSWORD"),
			DB:       viper.GetInt("REDIS_DB"),
		},
		Anthropic: AnthropicConfig{
			APIKey: viper.GetString("ANTHROPIC_API_KEY"),
			Model:  viper.GetString("ANTHROPIC_MODEL"),
		},
		SMTP: SMTPConfig{
			Host: viper.GetString("SMTP_HOST"),
			Port: viper.GetInt("SMTP_PORT"),
			User: viper.GetString("SMTP_USER"),
			Pass: viper.GetString("SMTP_PASS"),
			From: viper.GetString("SMTP_FROM"),
		},
	}
	return cfg, nil
}

func setDefaults() {
	viper.SetDefault("APP_NAME", "survey-agent")
	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("APP_PORT", "8080")
	viper.SetDefault("APP_URL", "http://localhost:8080")
	viper.SetDefault("FRONTEND_URL", "http://localhost:5173")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("DB_POOL_MIN", 2)
	viper.SetDefault("DB_POOL_MAX", 10)
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("REDIS_DB", 0)
	viper.SetDefault("ANTHROPIC_MODEL", "claude-sonnet-4-6")
	viper.SetDefault("SMTP_PORT", 1025)
}
