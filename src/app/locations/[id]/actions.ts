'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertReview(
  locationId: string,
  rating: 'good' | 'meh' | 'not_good'
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const { error } = await supabase.from('reviews').upsert(
    { user_id: user.id, location_id: locationId, rating },
    { onConflict: 'user_id,location_id' }
  )

  if (error) return error.message

  revalidatePath(`/locations/${locationId}`)
  return null
}
