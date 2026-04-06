import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FriendsClient, { type FriendWithTrips } from './FriendsClient'
import { Trip, Location, Profile } from '@/types'
import { type FriendReview } from '@/components/LocationReviews'

type TripWithLocation = Trip & { location: Location }

export default async function FriendsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get accepted friend IDs
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  if (friendIds.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <div className="px-4 pb-2">
          <h1 className="text-lg font-bold text-[#1a1a1a] md:text-xl">All friends</h1>
        </div>
        <FriendsClient friends={[]} reviewsByLocation={{}} />
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [{ data: profilesData }, { data: tripsData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds),
    supabase
      .from('trips')
      .select('*, location:locations(*)')
      .in('user_id', friendIds)
      .order('arriving_on', { ascending: true }),
  ])

  const profiles = (profilesData ?? []) as Profile[]
  const trips = (tripsData ?? []) as TripWithLocation[]

  // Map trips by user_id for quick lookup
  const tripsByUser = new Map<string, TripWithLocation[]>()
  for (const trip of trips) {
    const list = tripsByUser.get(trip.user_id) ?? []
    list.push(trip)
    tripsByUser.set(trip.user_id, list)
  }

  const friends: FriendWithTrips[] = profiles.map((profile) => {
    const userTrips = tripsByUser.get(profile.id) ?? []
    const currentTrip = userTrips.find((t) => t.is_current)
    const nextTrip = userTrips.find(
      (t) => !t.is_current && t.arriving_on != null && t.arriving_on >= today
    )

    return {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      currentLocation: currentTrip?.location?.name ?? null,
      currentLocationId: currentTrip?.location_id ?? null,
      nextLocation: nextTrip?.location?.name ?? null,
      nextLocationId: nextTrip?.location_id ?? null,
    }
  })

  // Sort: friends with current location first, then next location, then alphabetically
  friends.sort((a, b) => {
    if (a.currentLocation && !b.currentLocation) return -1
    if (!a.currentLocation && b.currentLocation) return 1
    if (a.nextLocation && !b.nextLocation) return -1
    if (!a.nextLocation && b.nextLocation) return 1
    return a.full_name.localeCompare(b.full_name)
  })

  // Fetch reviews for all locations shown in the grid (friends + self)
  const locationIds = [...new Set(
    friends.flatMap((f) => [f.currentLocationId, f.nextLocationId].filter(Boolean) as string[])
  )]
  const reviewsByLocation: Record<string, FriendReview[]> = {}
  if (locationIds.length > 0) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('location_id, rating, profile:profiles(id, full_name, avatar_url)')
      .in('location_id', locationIds)
      .in('user_id', [...friendIds, user.id])
    for (const r of (reviewsData ?? []) as any[]) {
      if (!reviewsByLocation[r.location_id]) reviewsByLocation[r.location_id] = []
      reviewsByLocation[r.location_id].push({ rating: r.rating, profile: r.profile })
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 pb-2">
        <h1 className="text-lg font-bold text-[#1a1a1a] md:text-xl">All friends</h1>
      </div>
      <FriendsClient friends={friends} reviewsByLocation={reviewsByLocation} />
    </div>
  )
}
