'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)

  revalidatePath('/profile')
}

export async function rejectFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)

  revalidatePath('/profile')
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
  revalidatePath('/profile')
}

export async function updateStatus(_: string | null, formData: FormData): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const status = formData.get('status') as string

  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', user.id)

  if (error) return error.message

  revalidatePath('/profile')
  return null
}
