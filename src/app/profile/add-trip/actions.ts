'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function addTrip(_: string | null, formData: FormData): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const placeName = (formData.get('place_name') as string).trim()
  const googlePlaceId = (formData.get('google_place_id') as string).trim()
  const photoUrl = (formData.get('photo_url') as string).trim() || null
  const arrivingOn = (formData.get('arriving_on') as string) || null
  const leavingOn = (formData.get('leaving_on') as string) || null
  const dateType = formData.get('date_type') as 'exact' | 'flexible'
  const isCurrent = formData.get('is_current') === 'true'

  if (!placeName || !googlePlaceId) return 'Please select a location from the suggestions'

  // Insert if not exists; on conflict do nothing (no UPDATE policy on locations)
  const { data: inserted } = await supabase
    .from('locations')
    .upsert(
      { google_place_id: googlePlaceId, name: placeName, photo_url: photoUrl },
      { onConflict: 'google_place_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  // If the row already existed, upsert returns nothing — fetch it by place ID
  const location = inserted ?? (
    await supabase
      .from('locations')
      .select()
      .eq('google_place_id', googlePlaceId)
      .single()
  ).data

  if (!location) return 'Failed to save location'

  // If marking as current, unset any previous current trip
  if (isCurrent) {
    await supabase
      .from('trips')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .eq('is_current', true)
  }

  const { error } = await supabase.from('trips').insert({
    user_id: user.id,
    location_id: location.id,
    arriving_on: arrivingOn,
    leaving_on: leavingOn,
    date_type: dateType,
    is_current: isCurrent,
  })

  if (error) return error.message

  redirect('/profile')
}
