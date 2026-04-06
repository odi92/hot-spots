'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed':
    'Please confirm your email before signing in. Check your inbox for a confirmation link.',
  'email rate limit exceeded':
    'Too many attempts. Please wait a few minutes and try again.',
}

export async function login(_: string | null, formData: FormData): Promise<string | null> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return FRIENDLY_ERRORS[error.message] ?? error.message

  redirect('/')
}
