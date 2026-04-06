'use server'

import { createClient } from '@/lib/supabase/server'

export type RegisterState =
  | { type: 'error' | 'confirm'; message: string }
  | { type: 'success'; userId: string }
  | null

const FRIENDLY_ERRORS: Record<string, string> = {
  'email rate limit exceeded':
    'Too many accounts created recently. Please wait a few minutes before trying again, or use a different email address.',
  'User already registered':
    'An account with this email already exists. Try signing in instead.',
}

export async function register(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  })

  if (error) {
    const message = FRIENDLY_ERRORS[error.message] ?? error.message
    return { type: 'error', message }
  }

  // No session means email confirmation is required before the user can log in
  if (!data.session) {
    return {
      type: 'confirm',
      message: 'We sent a confirmation link to your email. Click it to activate your account, then sign in.',
    }
  }

  return { type: 'success', userId: data.user!.id }
}
