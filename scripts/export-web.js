#!/usr/bin/env node
/**
 * Builds the web app for hosting: `npm run web:export` → dist/
 *
 * The app is a single-page app (app.json web.output "single"): one
 * index.html that loads the JavaScript, which then shows the right screen.
 * So that links like /privacy and /delete-account open directly on any host
 * (and the stores' and Google's checks find a page there), this also writes
 * a copy of index.html for every route: dist/privacy.html, dist/settings.html
 * and so on, the same file layout a static export uses.
 *
 * Needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set (from
 * .env locally, or GitHub secrets in the workflow): they're built into the app.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')

/** app/(public)/privacy.tsx → "privacy"; group folders don't appear in URLs. */
function routes(dir = path.join(root, 'app'), prefix = []) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const seg = /^\(.*\)$/.test(entry.name) ? [] : [entry.name]
      out.push(...routes(path.join(dir, entry.name), [...prefix, ...seg]))
      continue
    }
    const m = entry.name.match(/^(.+)\.tsx?$/)
    if (!m || m[1].startsWith('_') || m[1].startsWith('+') || m[1].includes('[')) continue
    const parts = m[1] === 'index' ? prefix : [...prefix, m[1]]
    if (parts.length) out.push(parts.join('/'))
  }
  return [...new Set(out)]
}

if (!process.argv.includes('--skip-export')) {
  for (const key of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
    const fromEnvFile = fs.existsSync(path.join(root, '.env')) && fs.readFileSync(path.join(root, '.env'), 'utf8').includes(key)
    if (!process.env[key] && !fromEnvFile) {
      console.error(`${key} isn't set. Add it to .env (or the environment) before exporting.`)
      process.exit(1)
    }
  }
  execSync('node scripts/build-legal.js --check', { cwd: root, stdio: 'inherit' })
  execSync('npx expo export --platform web --clear', { cwd: root, stdio: 'inherit' })
}

const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const written = []
for (const route of routes()) {
  const file = path.join(dist, `${route}.html`)
  if (fs.existsSync(file)) continue
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, index)
  written.push(`${route}.html`)
}
console.log(`\nWeb build ready in dist/ (pages: index.html, ${written.join(', ')}).`)
