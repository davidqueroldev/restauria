import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a Supabase client with the SERVICE_ROLE_KEY to bypass RLS and use Admin Auth API
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        const { email, password, fullName, role } = await request.json()

        // 1. Create the user in Supabase Auth
        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: { full_name: fullName, role: role } // Metadata triggers profile creation
        })

        if (createError) throw createError

        // 2. Profile is created automatically by the trigger `handle_new_user` on `public.profiles`
        // However, we should verify or force update the role if the trigger didn't handle it perfectly
        // (Our trigger does `(new.raw_user_meta_data->>'role')::user_role`, so it should work!)

        return NextResponse.json({ success: true, user })

    } catch (error: unknown) {
        console.error('Error creating user:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
