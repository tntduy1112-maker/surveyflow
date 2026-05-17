// Client-side port of backend/internal/service/brief_generator.go
// Produces the same plain-text Product Investment Brief from session answers.

const typeMap   = { web:'Web app (browser)', mobile:'Mobile app (iOS/Android)', both:'Web + Mobile', internal:'Internal team tool' }
const userMap   = { consumers:'General public (B2C)', businesses:'Businesses (B2B)', internal:'Internal team only', marketplace:'Two-sided marketplace' }
const probMap   = { saves_time:'Saves time on a repetitive task', connects:'Connects people who need each other', replaces_manual:'Replaces a paper / manual process', affordable:'Makes something expensive more accessible', track:'Helps people track or manage information' }
const solMap    = { spreadsheets:'Spreadsheets / manual documents', nothing:'No good solution currently exists', competitor:'A competitor product', cobbled:'Multiple tools stitched together', manual:'Done manually or physically' }
const actionMap = { search:'Search and find something', book:'Book or schedule something', buy_sell:'Buy or sell something', create:'Create and manage content', communicate:'Connect and communicate', track:'Track and monitor something' }
const screenMap = { login:'Login / Register', dashboard:'Home / Dashboard', search:'Search / Browse / Explore', profile:'Profile / Account settings', messaging:'Messaging / Chat', booking:'Booking / Scheduling / Calendar', payment:'Payment / Checkout', admin:'Admin panel', notifications:'Notifications feed', reporting:'Reports / Analytics' }
const featMap   = { auth:'User login and registration', search_filter:'Search and filtering', notifications:'Email or push notifications', payments:'Payment processing (Stripe)', file_upload:'File / image uploads', chat:'Chat or messaging', admin_panel:'Admin panel', analytics:'Reporting / analytics dashboard', integrations:'Third-party integrations' }
const lookMap   = { minimal:'Clean and minimal (like Notion, Linear)', professional:'Professional and corporate (like Salesforce)', colorful:'Colorful and approachable (like Duolingo, Canva)', dark:'Dark mode / developer style (like GitHub)', marketplace:'Marketplace / consumer style (like Airbnb)' }
const metricMap = { users:'Number of users who sign up', revenue:'Revenue generated', tasks:'Number of tasks / bookings completed', validation:'Idea validated (real users tried it)', retention:'Users keep coming back (retention / DAU)' }
const timeMap   = { '2weeks':'1-2 weeks (Micro-MVP)', '1month':'1 month (Small MVP)', '3months':'2-3 months (Solid MVP)', '6months':'6 months+ (Full product)', flexible:'No strict deadline' }
const budgetMap = { free:'Free / under $20/month (use free tiers)', small:'$20-$100/month', medium:'$100-$500/month', large:'$500+/month', unsure:'Not specified — Claude to recommend' }
const levelLabel = { rough:'Rough idea', some:'Some detail', detailed:'Detailed requirements' }

function am(answers) {
  const m = {}
  answers.forEach(a => { m[a.question_id] = a.answer })
  return m
}
function sv(m, qid, field)  { return (m[qid]?.[field]) || '' }
function arr(m, qid, field) {
  const v = m[qid]?.[field]
  if (!Array.isArray(v)) return []
  return v.filter(x => x && x !== '__other__')
}
function lbl(map, key, fallback) { return map[key] || (key ? key : fallback) }
function sep(title, width=51) {
  const pad = Math.max(0, width - title.length - 4)
  return `━━━ ${title} ${'━'.repeat(pad)}`
}

export function generateBrief(answers, detailLevel = 'rough') {
  const m = am(answers)
  const gaps = []
  const lines = []
  const w = s => lines.push(s)

  const appName = sv(m, 'app_identity', 'app_name')
  const similar = sv(m, 'app_identity', 'similar_app')
  const appDesc = sv(m, 'app_identity', 'app_description')
  const appType = sv(m, 'app_type', 'value')
  const users   = arr(m, 'target_users', 'values')
  const probs   = arr(m, 'problem', 'values')
  const sol     = sv(m, 'current_solution', 'value')
  const action  = sv(m, 'core_action', 'value')
  const screens = arr(m, 'key_screens', 'values')
  const feats   = arr(m, 'must_have_features', 'values')
  const looks   = arr(m, 'look_feel', 'values')
  const metric  = sv(m, 'success_metric', 'value')
  const timeline = sv(m, 'timeline', 'value')
  const budget  = sv(m, 'budget', 'value')
  const extra   = sv(m, 'anything_else', 'text')

  const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  w('╔══════════════════════════════════════════════════╗')
  w('║     PRODUCTCON LAB - PRODUCT INVESTMENT BRIEF    ║')
  w('╚══════════════════════════════════════════════════╝')
  w(`Generated: ${date}  |  Detail level: ${levelLabel[detailLevel] || 'Rough idea'}`)

  w(''); w(sep('PRODUCT VISION')); w('')
  if (!appName) gaps.push('App name')
  w(`Product name    : ${appName || '[ASSUMPTION: to be named]'}`)
  if (similar) w(`Reference app   : ${similar}`)
  w(`Vision          : ${appDesc || '[ASSUMPTION: general productivity tool]'}`)

  w(''); w(sep('PRODUCT PROFILE')); w('')
  if (!appType) gaps.push('App type')
  w(`Platform        : ${lbl(typeMap, appType, '[ASSUMPTION: Web app]')}`)
  w('Target users    :')
  if (users.length) users.forEach(u => w(`  - ${lbl(userMap, u, u)}`))
  else { w('  - [ASSUMPTION: General public / consumers]'); gaps.push('Target users') }
  if (!action) gaps.push('Core user action')
  w(`Core job-to-do  : ${lbl(actionMap, action, '[ASSUMPTION: manage and track information]')}`)
  if (!sol) gaps.push('Current workaround')
  w(`Current workaround : ${lbl(solMap, sol, '[ASSUMPTION: spreadsheets or manual process]')}`)
  w('Problems solved :')
  if (probs.length) probs.forEach(p => w(`  - ${lbl(probMap, p, p)}`))
  else { w('  - [ASSUMPTION: general productivity or task management]'); gaps.push('Problems being solved') }

  w(''); w(sep('MVP SCOPE')); w('')
  w('Must-have features (day 1 only):')
  if (feats.length) feats.forEach(f => w(`  - ${lbl(featMap, f, f)}`))
  else w('  - [ASSUMPTION: user auth, core CRUD, basic notifications]')
  if (screens.length) { w('Key screens:'); screens.forEach(s => w(`  - ${lbl(screenMap, s, s)}`)) }
  if (looks.length)   { w('Look & feel:'); looks.forEach(l => w(`  - ${lbl(lookMap, l, l)}`)) }

  w(''); w(sep('INVESTMENT PARAMETERS')); w('')
  if (!timeline) gaps.push('Timeline')
  w(`Timeline              : ${lbl(timeMap, timeline, '[ASSUMPTION: 1-2 months]')}`)
  if (!budget) gaps.push('Monthly infra budget')
  w(`Monthly infra budget  : ${lbl(budgetMap, budget, '[ASSUMPTION: free / low-cost tiers]')}`)
  if (!metric) gaps.push('Success metric')
  w(`Primary success metric: ${lbl(metricMap, metric, '[ASSUMPTION: user sign-ups and active engagement]')} - measured at 6 months`)

  w(''); w(sep('DRAFT HYPOTHESIS (for Head of Product to refine)')); w('')
  const believeThat = (appName || '[ASSUMPTION: this product]') + (action ? ' - ' + lbl(actionMap, action, '') : '')
  const forUsers    = users.length ? users.map(u => lbl(userMap,u,u)).join(', ') : '[ASSUMPTION: general consumers]'
  const willResult  = probs.length ? probs.map(p => lbl(probMap,p,p).toLowerCase()).join('; ') : '[ASSUMPTION: improved productivity and reduced manual effort]'
  const weKnow      = lbl(metricMap, metric, '[ASSUMPTION: key metric shows measurable improvement]') + ' shows measurable improvement'
  w(`We believe that   ${believeThat}`)
  w(`For               ${forUsers}`)
  w(`Will result in    ${willResult}`)
  w(`We'll know when   ${weKnow}`)
  w('')
  w('[ASSUMPTION: baseline and target numbers unknown - Head of Product must research and add]')

  w(''); w(sep('CONSTRAINTS & ADDITIONAL CONTEXT')); w('')
  w(extra || '(none provided)')

  w(''); w(sep('ASSUMPTIONS TO VALIDATE')); w('')
  if (gaps.length) gaps.forEach(g => w(`  - ${g}: [ASSUMPTION: not provided - Claude should research and state assumption explicitly]`))
  else w('(All key fields answered)')

  return lines.join('\n')
}
