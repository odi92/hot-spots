/**
 * Creates 15 pre-confirmed test users via the Supabase Admin API.
 *
 * Prerequisites:
 *   SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   (Dashboard → Project Settings → API → service_role)
 *
 * Usage:
 *   npx tsx scripts/seed-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Missing environment variables.\n' +
    'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'Test1234!'

const USERS = Array.from({ length: 15 }, (_, i) => ({
  email: `test${i + 1}@mail.com`,
  full_name: `Test User ${i + 1}`,
}))

async function main() {
  console.log(`Creating ${USERS.length} test users...\n`)

  const results: { email: string; password: string; status: string }[] = []

  for (const { email, full_name } of USERS) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,       // skip email confirmation
      user_metadata: { full_name },
    })

    if (error) {
      results.push({ email, password: PASSWORD, status: `FAILED: ${error.message}` })
    } else {
      results.push({ email, password: PASSWORD, status: 'OK' })
    }
  }

  console.log('Email                   Password    Status')
  console.log('─'.repeat(55))
  for (const r of results) {
    const ok = r.status === 'OK'
    console.log(
      `${r.email.padEnd(24)}${r.password.padEnd(12)}${ok ? '✓' : r.status}`
    )
  }

  const failed = results.filter((r) => r.status !== 'OK').length
  console.log(`\n${results.length - failed}/${results.length} users created.`)
  if (failed > 0) {
    console.log(`${failed} failed (likely already exist — safe to ignore).`)
  }
}

main()
