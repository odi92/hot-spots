'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(
  _: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const full_name = (formData.get('full_name') as string).trim()
  const status = (formData.get('status') as string).trim()

  if (!full_name) return 'Name is required'

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, status: status || null })
    .eq('id', user.id)

  if (error) return error.message
  revalidatePath('/profile')
  return 'saved'
}

export async function changePassword(
  _: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) return 'Passwords do not match'
  if (password.length < 6) return 'Password must be at least 6 characters'

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return error.message
  return 'saved'
}
