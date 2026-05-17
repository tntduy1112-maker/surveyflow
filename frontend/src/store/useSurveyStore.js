import { create } from 'zustand'
import { visibleQuestions } from '../constants/questions'
import { createSession, saveAnswer, getSession } from '../services/survey.service'

const SESSION_KEY = 'survey_session_id'

const useSurveyStore = create((set, get) => ({
  // session
  sessionId: null,
  isInitializing: false,
  initError: null,

  // answer state
  answers: {},        // { [questionId]: string | string[] | object }
  others: {},         // { [questionId]: string }
  uploadedFiles: {},  // { [`${qid}_${opt}`]: File[] }

  // navigation
  currentIdx: 0,

  // ── computed ────────────────────────────────────────────────────────────────

  getDetailLevel: () => {
    const a = get().answers['detail_level']
    if (a && typeof a === 'object' && a.value) return a.value
    return 'rough'
  },

  getVisible: () => visibleQuestions(get().getDetailLevel()),

  currentQuestion: () => {
    const visible = get().getVisible()
    return visible[get().currentIdx] || null
  },

  totalQuestions: () => get().getVisible().length,

  // ── session init ────────────────────────────────────────────────────────────

  initSession: async () => {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) {
      // Try to resume
      try {
        const res = await getSession(existing)
        const { session_id, answers: savedAnswers, current_step, detail_level } = res.data.data
        const hydratedAnswers = {}
        if (savedAnswers) {
          savedAnswers.forEach(a => { hydratedAnswers[a.question_id] = a.answer })
        }
        set({
          sessionId: session_id,
          answers: hydratedAnswers,
          currentIdx: current_step || 0,
        })
        return
      } catch {
        // Session expired or invalid - create new one
        localStorage.removeItem(SESSION_KEY)
      }
    }

    set({ isInitializing: true, initError: null })
    try {
      const res = await createSession()
      const { session_id } = res.data.data
      localStorage.setItem(SESSION_KEY, session_id)
      set({ sessionId: session_id, isInitializing: false })
    } catch (err) {
      set({ isInitializing: false, initError: err.message })
    }
  },

  // ── answer setters ──────────────────────────────────────────────────────────

  setSingle: (questionId, value) => {
    // Store as { value } object so backend JSONB is consistent
    set(state => ({
      answers: { ...state.answers, [questionId]: { value } },
    }))
  },

  toggleMultiple: (questionId, value) =>
    set(state => {
      const current = Array.isArray(state.answers[questionId]?.values)
        ? state.answers[questionId].values
        : []

      if (value === 'none') {
        const alreadyNone = current.includes('none')
        return { answers: { ...state.answers, [questionId]: { values: alreadyNone ? [] : ['none'] } } }
      }

      const withoutNone = current.filter(v => v !== 'none')
      const idx = withoutNone.indexOf(value)
      const next = idx === -1 ? [...withoutNone, value] : withoutNone.filter(v => v !== value)
      return { answers: { ...state.answers, [questionId]: { values: next } } }
    }),

  setTextField: (questionId, fieldKey, value) =>
    set(state => ({
      answers: {
        ...state.answers,
        [questionId]: { ...(state.answers[questionId] || {}), [fieldKey]: value },
      },
    })),

  setTextarea: (questionId, value) =>
    set(state => ({ answers: { ...state.answers, [questionId]: { text: value } } })),

  setOther: (questionId, value) =>
    set(state => ({ others: { ...state.others, [questionId]: value } })),

  addFiles: (questionId, optionValue, files) => {
    const key = `${questionId}_${optionValue}`
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [key]: [...(state.uploadedFiles[key] || []), ...files],
      },
    }))
  },

  removeFile: (questionId, optionValue, fileIdx) => {
    const key = `${questionId}_${optionValue}`
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [key]: (state.uploadedFiles[key] || []).filter((_, i) => i !== fileIdx),
      },
    }))
  },

  isSelected: (questionId, value) => {
    const a = get().answers[questionId]
    if (!a) return false
    // single choice: { value: 'X' }
    if (a.value !== undefined) return a.value === value
    // multiple choice: { values: [...] }
    if (Array.isArray(a.values)) return a.values.includes(value)
    return false
  },

  // ── navigation + persist ────────────────────────────────────────────────────

  navigate: async (dir, questionId) => {
    const state = get()
    const visible = state.getVisible()
    const total = visible.length
    const next = state.currentIdx + dir

    if (next < 0 || next > total) return

    // Save current question's answer to backend before moving forward
    if (dir === 1 && questionId && state.sessionId) {
      const answer = state.answers[questionId] || {}
      // Fire-and-forget — don't block navigation on network
      saveAnswer(state.sessionId, {
        question_id: questionId,
        answer,
        current_step: next,
        total_steps: total,
      }).catch(() => {/* non-blocking, will retry on resume */})
    }

    set({ currentIdx: next })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },

  setCurrentIdx: (idx) => set({ currentIdx: idx }),
  setSessionId:  (id)  => set({ sessionId: id }),

  reset: () => {
    localStorage.removeItem(SESSION_KEY)
    set({
      sessionId: null,
      answers: {},
      others: {},
      uploadedFiles: {},
      currentIdx: 0,
      initError: null,
    })
  },
}))

export default useSurveyStore
