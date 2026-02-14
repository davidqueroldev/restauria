import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing public keys in .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
    console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail, but public access might work.')
} else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY is found.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

async function testConnection() {
  console.log('Testing connection to:', supabaseUrl)

  // Try to fetch something simple, public tables
  const { count, error } = await supabase.from('tables').select('*', { count: 'exact', head: true })

  if (error) {
    console.error('❌ Connection Failed:', error.message)
  } else {
    console.log('✅ Connection Successful! Database is reachable.')
    console.log(`   Found ${count} tables (or rows in tables table).`)
  }
}

testConnection()
