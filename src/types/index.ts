export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  status: string | null
  created_at: string
}

export type Trip = {
  id: string
  user_id: string
  location_id: string
  arriving_on: string | null
  leaving_on: string | null
  date_type: 'exact' | 'flexible'
  is_current: boolean
  created_at: string
  location?: Location
  profile?: Profile
}

export type Location = {
  id: string
  google_place_id: string
  name: string
  photo_url: string | null
  created_at: string
}

export type Review = {
  id: string
  user_id: string
  location_id: string
  rating: 'good' | 'meh' | 'not_good'
  created_at: string
}

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export type RatingEmoji = {
  value: 'good' | 'meh' | 'not_good'
  emoji: string
  label: string
}

export const RATINGS: RatingEmoji[] = [
  { value: 'good', emoji: '🔥', label: 'Hot' },
  { value: 'meh', emoji: '😐', label: 'Meh' },
  { value: 'not_good', emoji: '👎', label: 'Not good' },
]
