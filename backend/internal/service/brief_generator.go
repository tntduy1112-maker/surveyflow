package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/productcon/survey-agent/internal/domain"
)

// value-label maps matching survey.html
var (
	typeMap = map[string]string{
		"web": "Web app (browser)", "mobile": "Mobile app (iOS/Android)",
		"both": "Web + Mobile", "internal": "Internal team tool",
	}
	userMap = map[string]string{
		"consumers": "General public (B2C)", "businesses": "Businesses (B2B)",
		"internal": "Internal team only", "marketplace": "Two-sided marketplace",
	}
	probMap = map[string]string{
		"saves_time": "Saves time on a repetitive task", "connects": "Connects people who need each other",
		"replaces_manual": "Replaces a paper / manual process", "affordable": "Makes something expensive more accessible",
		"track": "Helps people track or manage information",
	}
	solMap = map[string]string{
		"spreadsheets": "Spreadsheets / manual documents", "nothing": "No good solution currently exists",
		"competitor": "A competitor product", "cobbled": "Multiple tools stitched together",
		"manual": "Done manually or physically",
	}
	actionMap = map[string]string{
		"search": "Search and find something", "book": "Book or schedule something",
		"buy_sell": "Buy or sell something", "create": "Create and manage content",
		"communicate": "Connect and communicate", "track": "Track and monitor something",
	}
	screenMap = map[string]string{
		"login": "Login / Register", "dashboard": "Home / Dashboard",
		"search": "Search / Browse / Explore", "profile": "Profile / Account settings",
		"messaging": "Messaging / Chat", "booking": "Booking / Scheduling / Calendar",
		"payment": "Payment / Checkout", "admin": "Admin panel",
		"notifications": "Notifications feed", "reporting": "Reports / Analytics",
	}
	featMap = map[string]string{
		"auth": "User login and registration", "search_filter": "Search and filtering",
		"notifications": "Email or push notifications", "payments": "Payment processing (Stripe)",
		"file_upload": "File / image uploads", "chat": "Chat or messaging",
		"admin_panel": "Admin panel", "analytics": "Reporting / analytics dashboard",
		"integrations": "Third-party integrations",
	}
	lookMap = map[string]string{
		"minimal": "Clean and minimal (like Notion, Linear)", "professional": "Professional and corporate (like Salesforce)",
		"colorful": "Colorful and approachable (like Duolingo, Canva)", "dark": "Dark mode / developer style (like GitHub)",
		"marketplace": "Marketplace / consumer style (like Airbnb)",
	}
	metricMap = map[string]string{
		"users": "Number of users who sign up", "revenue": "Revenue generated",
		"tasks": "Number of tasks / bookings completed", "validation": "Idea validated (real users tried it)",
		"retention": "Users keep coming back (retention / DAU)",
	}
	timeMap = map[string]string{
		"2weeks": "1-2 weeks (Micro-MVP)", "1month": "1 month (Small MVP)",
		"3months": "2-3 months (Solid MVP)", "6months": "6 months+ (Full product)",
		"flexible": "No strict deadline",
	}
	budgetMap = map[string]string{
		"free": "Free / under $20/month (use free tiers)", "small": "$20-$100/month",
		"medium": "$100-$500/month", "large": "$500+/month",
		"unsure": "Not specified — Claude to recommend",
	}
)

// answerMap builds a lookup: questionID -> answer
func answerMap(answers []domain.SurveyAnswer) map[string]map[string]interface{} {
	m := make(map[string]map[string]interface{}, len(answers))
	for _, a := range answers {
		m[a.QuestionID] = a.Answer
	}
	return m
}

func strVal(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func strSlice(m map[string]interface{}, key string) []string {
	if v, ok := m[key]; ok {
		switch t := v.(type) {
		case []interface{}:
			out := make([]string, 0, len(t))
			for _, i := range t {
				if s, ok := i.(string); ok && s != "__other__" {
					out = append(out, s)
				}
			}
			return out
		}
	}
	return nil
}

func mapLabel(m map[string]string, key, fallback string) string {
	if l, ok := m[key]; ok {
		return l
	}
	if key != "" {
		return key
	}
	return fallback
}

func GenerateBrief(answers []domain.SurveyAnswer) string {
	am := answerMap(answers)
	var gaps []string
	var sb strings.Builder

	w := func(s string) { sb.WriteString(s) }
	wl := func(s string) { sb.WriteString(s + "\n") }
	sep := func(title string, width int) {
		pad := width - len(title) - 4
		if pad < 0 {
			pad = 0
		}
		wl(fmt.Sprintf("━━━ %s %s", title, strings.Repeat("━", pad)))
	}

	// ── extract values ───────────────────────────────────────────────────────

	appName := strVal(am["app_identity"], "app_name")
	similar := strVal(am["app_identity"], "similar_app")
	appDesc := strVal(am["app_identity"], "app_description")

	levelRaw := strVal(am["detail_level"], "value")
	levelLabel := map[string]string{"rough": "Rough idea", "some": "Some detail", "detailed": "Detailed requirements"}[levelRaw]
	if levelLabel == "" {
		levelLabel = "Rough idea"
	}

	appType := strVal(am["app_type"], "value")
	users   := strSlice(am["target_users"], "values")
	probs   := strSlice(am["problem"], "values")
	sol     := strVal(am["current_solution"], "value")
	action  := strVal(am["core_action"], "value")
	screens := strSlice(am["key_screens"], "values")
	feats   := strSlice(am["must_have_features"], "values")
	looks   := strSlice(am["look_feel"], "values")
	metric  := strVal(am["success_metric"], "value")
	timeline := strVal(am["timeline"], "value")
	budget  := strVal(am["budget"], "value")
	extra   := strVal(am["anything_else"], "text")

	// ── header ───────────────────────────────────────────────────────────────

	date := time.Now().Format("January 2, 2006")
	wl("╔══════════════════════════════════════════════════╗")
	wl("║     PRODUCTCON LAB - PRODUCT INVESTMENT BRIEF    ║")
	wl("╚══════════════════════════════════════════════════╝")
	wl(fmt.Sprintf("Generated: %s  |  Detail level: %s", date, levelLabel))

	// ── product vision ───────────────────────────────────────────────────────

	wl("")
	sep("PRODUCT VISION", 51)
	wl("")
	if appName == "" {
		gaps = append(gaps, "App name")
	}
	wl(fmt.Sprintf("Product name    : %s", or(appName, "[ASSUMPTION: to be named]")))
	if similar != "" {
		wl(fmt.Sprintf("Reference app   : %s", similar))
	}
	wl(fmt.Sprintf("Vision          : %s", or(appDesc, "[ASSUMPTION: general productivity tool]")))

	// ── product profile ──────────────────────────────────────────────────────

	wl("")
	sep("PRODUCT PROFILE", 51)
	wl("")
	if appType == "" {
		gaps = append(gaps, "App type")
	}
	wl(fmt.Sprintf("Platform        : %s", mapLabel(typeMap, appType, "[ASSUMPTION: Web app]")))

	w("Target users    :\n")
	if len(users) > 0 {
		for _, u := range users {
			wl("  - " + mapLabel(userMap, u, u))
		}
	} else {
		wl("  - [ASSUMPTION: General public / consumers]")
		gaps = append(gaps, "Target users")
	}

	if action == "" {
		gaps = append(gaps, "Core user action")
	}
	wl(fmt.Sprintf("Core job-to-do  : %s", mapLabel(actionMap, action, "[ASSUMPTION: manage and track information]")))

	if sol == "" {
		gaps = append(gaps, "Current workaround")
	}
	wl(fmt.Sprintf("Current workaround : %s", mapLabel(solMap, sol, "[ASSUMPTION: spreadsheets or manual process]")))

	w("Problems solved :\n")
	if len(probs) > 0 {
		for _, p := range probs {
			wl("  - " + mapLabel(probMap, p, p))
		}
	} else {
		wl("  - [ASSUMPTION: general productivity or task management]")
		gaps = append(gaps, "Problems being solved")
	}

	// ── mvp scope ────────────────────────────────────────────────────────────

	wl("")
	sep("MVP SCOPE", 51)
	wl("")

	wl("Must-have features (day 1 only):")
	if len(feats) > 0 {
		for _, f := range feats {
			wl("  - " + mapLabel(featMap, f, f))
		}
	} else {
		wl("  - [ASSUMPTION: user auth, core CRUD, basic notifications]")
	}

	if len(screens) > 0 {
		wl("Key screens:")
		for _, sc := range screens {
			wl("  - " + mapLabel(screenMap, sc, sc))
		}
	}

	if len(looks) > 0 {
		wl("Look & feel:")
		for _, l := range looks {
			wl("  - " + mapLabel(lookMap, l, l))
		}
	}

	// ── investment parameters ────────────────────────────────────────────────

	wl("")
	sep("INVESTMENT PARAMETERS", 51)
	wl("")
	if timeline == "" {
		gaps = append(gaps, "Timeline")
	}
	wl(fmt.Sprintf("Timeline              : %s", mapLabel(timeMap, timeline, "[ASSUMPTION: 1-2 months]")))
	if budget == "" {
		gaps = append(gaps, "Monthly infra budget")
	}
	wl(fmt.Sprintf("Monthly infra budget  : %s", mapLabel(budgetMap, budget, "[ASSUMPTION: free / low-cost tiers]")))
	if metric == "" {
		gaps = append(gaps, "Success metric")
	}
	wl(fmt.Sprintf("Primary success metric: %s - measured at 6 months", mapLabel(metricMap, metric, "[ASSUMPTION: user sign-ups and active engagement]")))

	// ── draft hypothesis ─────────────────────────────────────────────────────

	wl("")
	sep("DRAFT HYPOTHESIS (for Head of Product to refine)", 51)
	wl("")

	believeThat := or(appName, "[ASSUMPTION: this product]")
	if action != "" {
		believeThat += " - " + mapLabel(actionMap, action, "")
	}

	var forUsers string
	if len(users) > 0 {
		labels := make([]string, 0, len(users))
		for _, u := range users {
			labels = append(labels, mapLabel(userMap, u, u))
		}
		forUsers = strings.Join(labels, ", ")
	} else {
		forUsers = "[ASSUMPTION: general consumers]"
	}

	var willResult string
	if len(probs) > 0 {
		labels := make([]string, 0, len(probs))
		for _, p := range probs {
			labels = append(labels, mapLabel(probMap, p, p))
		}
		willResult = strings.ToLower(strings.Join(labels, "; "))
	} else {
		willResult = "[ASSUMPTION: improved productivity and reduced manual effort]"
	}

	weKnowWhen := mapLabel(metricMap, metric, "[ASSUMPTION: key metric shows measurable improvement]") + " shows measurable improvement"

	wl(fmt.Sprintf("We believe that   %s", believeThat))
	wl(fmt.Sprintf("For               %s", forUsers))
	wl(fmt.Sprintf("Will result in    %s", willResult))
	wl(fmt.Sprintf("We'll know when   %s", weKnowWhen))
	wl("\n[ASSUMPTION: baseline and target numbers unknown - Head of Product must research and add]")

	// ── constraints ──────────────────────────────────────────────────────────

	wl("")
	sep("CONSTRAINTS & ADDITIONAL CONTEXT", 51)
	wl("")
	if extra != "" {
		wl(extra)
	} else {
		wl("(none provided)")
	}

	// ── assumptions to validate ──────────────────────────────────────────────

	wl("")
	sep("ASSUMPTIONS TO VALIDATE", 51)
	wl("")
	if len(gaps) > 0 {
		for _, g := range gaps {
			wl(fmt.Sprintf("  - %s: [ASSUMPTION: not provided - Claude should research and state assumption explicitly]", g))
		}
	} else {
		wl("(All key fields answered)")
	}

	return sb.String()
}

func or(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}
