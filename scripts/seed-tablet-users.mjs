import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Generate tablet users 2 through 21 (tablet1 already exists)
const users = []
for (let i = 2; i <= 21; i++) {
  users.push({
    email: `tablet${i}@restauria.com`,
    password: 'Password123!',
    role: 'TABLET',
    fullName: `Table ${i} Device`
  })
}

async function seedTabletUsers() {
  console.log(`Creating ${users.length} tablet users (tablet2 - tablet21)...\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role
      }
    })

    if (error) {
      if (error.message.includes('already has been registered') || error.status === 422) {
        console.log(`  ⏭  ${user.email} — already exists`)
        skipped++
      } else {
        console.error(`  ❌ ${user.email} — ${error.message}`)
        errors++
      }
    } else {
      console.log(`  ✅ ${user.email} — created (ID: ${data.user.id})`)
      created++
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`)
}

seedTabletUsers()
