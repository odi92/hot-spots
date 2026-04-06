'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendFriendRequest(addresseeId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
  })

  if (error) return error.message

  revalidatePath('/search')
  return null
}
