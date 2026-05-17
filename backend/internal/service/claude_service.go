package service

import (
	"context"
	"fmt"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"golang.org/x/sync/errgroup"
)

type Documents struct {
	Spec           string
	Stories        string
	DeploymentPlan string
	TestCases      string
}

type ClaudeService struct {
	client anthropic.Client
	model  string
}

func NewClaudeService(apiKey, model string) *ClaudeService {
	client := anthropic.NewClient(option.WithAPIKey(apiKey))
	if model == "" {
		model = "claude-sonnet-4-6"
	}
	return &ClaudeService{client: client, model: model}
}

var docKeys = []string{"spec", "stories", "deployment", "tests"}

var systemPrompts = map[string]string{
	"spec": `You are a senior product manager writing a formal Product Requirements Document.
Given a Product Investment Brief, produce a structured markdown PRD with these sections:
## Overview, ## Problem Statement, ## Goals & Success Metrics, ## Target Users, ## User Journey, ## Functional Requirements, ## Non-Functional Requirements, ## Out of Scope.
Wherever the brief shows [ASSUMPTION], flag it explicitly with a callout block.
Keep total length under 1500 words. Use markdown formatting throughout.`,

	"stories": `You are an agile product owner. Given a Product Investment Brief, produce a markdown file of user stories grouped by epic.
Each story format:
**Story: [title]**
As a [user type], I want [action] so that [outcome].
**Acceptance Criteria:**
- Step 1: ...
IF [condition] THEN [result] ELSE [fallback].
**Size:** XS/S/M/L/XL
Derive epics from the core action, target users, and must-have features. Flag stories where assumptions were required.`,

	"deployment": `You are a DevOps architect. Given a Product Investment Brief, produce a markdown Deployment Plan covering:
## Recommended Stack (justified by stated budget and timeline),
## Environment Setup (dev / staging / prod),
## CI/CD Pipeline (GitHub Actions YAML skeleton),
## Environment Variables Checklist,
## Health Checks & Monitoring,
## Estimated Monthly Cost Breakdown.
Align all recommendations to the stated timeline and budget. Flag cost assumptions explicitly.`,

	"tests": `You are a QA lead. Given a Product Investment Brief, produce a markdown Test Case document covering:
## Smoke Test Suite (5-10 critical paths),
## Functional Test Cases (table: ID | Title | Precondition | Steps | Expected Result),
## Edge Cases & Negative Tests,
## Definition of Done.
Derive test cases from the success metric and core user actions in the brief.`,
}

func (s *ClaudeService) GenerateDocuments(ctx context.Context, brief string) (*Documents, error) {
	type result struct {
		key  string
		text string
	}

	resultCh := make(chan result, len(docKeys))
	eg, egCtx := errgroup.WithContext(ctx)

	for _, key := range docKeys {
		key := key
		sysprompt := systemPrompts[key]
		eg.Go(func() error {
			msg, err := s.client.Messages.New(egCtx, anthropic.MessageNewParams{
				Model:     anthropic.Model(s.model),
				MaxTokens: 4096,
				System: []anthropic.TextBlockParam{
					{Text: sysprompt},
				},
				Messages: []anthropic.MessageParam{
					anthropic.NewUserMessage(anthropic.NewTextBlock(brief)),
				},
			})
			if err != nil {
				return fmt.Errorf("claude [%s]: %w", key, err)
			}
			if len(msg.Content) == 0 {
				return fmt.Errorf("claude [%s]: empty response", key)
			}
			resultCh <- result{key: key, text: msg.Content[0].Text}
			return nil
		})
	}

	// Close channel after all goroutines finish
	waitErr := make(chan error, 1)
	go func() {
		waitErr <- eg.Wait()
		close(resultCh)
	}()

	docs := &Documents{}
	for r := range resultCh {
		switch r.key {
		case "spec":
			docs.Spec = r.text
		case "stories":
			docs.Stories = r.text
		case "deployment":
			docs.DeploymentPlan = r.text
		case "tests":
			docs.TestCases = r.text
		}
	}

	if err := <-waitErr; err != nil {
		return docs, err
	}
	return docs, nil
}
