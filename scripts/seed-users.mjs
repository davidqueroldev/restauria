import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from .env.local in parent directory
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

const users = [
  {
    email: 'manager@restauria.com',
    password: 'Password123!',
    role: 'MANAGER',
    fullName: 'Manager User'
  },
  {
    email: 'kitchen@restauria.com',
    password: 'Password123!',
    role: 'KITCHEN',
    fullName: 'Kitchen Staff'
  },
  {
    email: 'waiter@restauria.com',
    password: 'Password123!',
    role: 'WAITER',
    fullName: 'Waiter User'
  },
  {
    email: 'tablet1@restauria.com',
    password: 'Password123!',
    role: 'TABLET',
    fullName: 'Table 1 Device'
  },
  ...Array.from({ length: 20 }, (_, i) => ({
    email: `tablet${i + 2}@restauria.com`,
    password: 'Password123!',
    role: 'TABLET',
    fullName: `Table ${i + 2} Device`
  }))
]

async function seedUsers() {
  console.log('Starting user seeding...')
  
  for (const user of users) {
    console.log(`Processing ${user.email}...`)
    
    // Check if user exists (by trying to sign in or just create - createUser fails if exists)
    // Detailed check might be needed if we want to be idempotent without error logs, 
    // but createUser returns error on duplicate which is fine to catch.
    
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
        console.log(`  -> User ${user.email} already exists. Skipping.`)
      } else {
        console.error(`  -> Error creating ${user.email}:`, error.message)
        console.dir(error)
      }
    } else {
      console.log(`  -> User ${user.email} created successfully (ID: ${data.user.id}).`)
    }
  }

  console.log('Seeding completed.')
}

seedUsers()
