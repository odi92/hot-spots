import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Profile, Trip, Location } from '@/types'
import UserAvatar from '@/components/UserAvatar'
import HotSpotsSection, { type HotSpot } from './HotSpotsSection'
import { type FriendReview } from '@/components/LocationReviews'

type TripWithLocation = Trip & { location: Location }

type FriendPreview = {
  id: string
  full_name: string
  avatar_url: string | null
  currentLocation: string | null
  nextLocation: string | null
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Accepted friend IDs
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
      <div className="flex flex-col flex-1 px-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
          <span className="text-4xl">✈️</span>
          <p className="font-medium text-[#1a1a1a]">Find your friends</p>
          <p className="text-sm text-gray-500">
            Search for friends to see where they&apos;re traveling.
          </p>
          <Link
            href="/search"
            className="mt-2 rounded-xl bg-[#ff5a1f] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Search
          </Link>
        </div>
      </div>
    )
  }

  // 2. Friend profiles + all their trips (parallel)
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: profilesData }, { data: tripsData }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', friendIds),
    supabase
      .from('trips')
      .select('*, location:locations(*)')
      .in('user_id', friendIds)
      .order('arriving_on', { ascending: true }),
  ])

  const profiles = (profilesData ?? []) as Profile[]
  const allTrips = (tripsData ?? []) as TripWithLocation[]

  // 3a. Friends grid (max 6, with current / next location)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const tripsByFriend = new Map<string, TripWithLocation[]>()
  for (const trip of allTrips) {
    const list = tripsByFriend.get(trip.user_id) ?? []
    list.push(trip)
    tripsByFriend.set(trip.user_id, list)
  }

  const friendPreviews: FriendPreview[] = profiles.map((p) => {
    const trips = tripsByFriend.get(p.id) ?? []
    const current = trips.find((t) => t.is_current)
    const next = trips.find((t) => !t.is_current && t.arriving_on != null && t.arriving_on >= today)
    return {
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      currentLocation: current?.location?.name ?? null,
      nextLocation: next?.location?.name ?? null,
    }
  })

  friendPreviews.sort((a, b) => {
    if (a.currentLocation && !b.currentLocation) return -1
    if (!a.currentLocation && b.currentLocation) return 1
    return a.full_name.localeCompare(b.full_name)
  })

  // 3b. Hot spots: top 9 locations by unique friend count
  const locationFriends = new Map<string, Set<string>>()
  const locationMeta = new Map<string, Location>()

  for (const trip of allTrips) {
    if (!locationFriends.has(trip.location_id)) {
      locationFriends.set(trip.location_id, new Set())
      locationMeta.set(trip.location_id, trip.location)
    }
    locationFriends.get(trip.location_id)!.add(trip.user_id)
  }

  const topLocationIds = [...locationFriends.entries()]
    .sort(([, a], [, b]) => b.size - a.size)
    .slice(0, 9)
    .map(([id]) => id)

  // 4. Reviews for hot spots + user's own reviews (parallel)
  const [{ data: reviewsData }, { data: myReviewsData }] = await Promise.all([
    topLocationIds.length > 0
      ? supabase
          .from('reviews')
          .select('location_id, rating, profile:profiles(id, full_name, avatar_url)')
          .in('location_id', topLocationIds)
          .in('user_id', [...friendIds, user.id])
      : Promise.resolve({ data: [] }),
    topLocationIds.length > 0
      ? supabase
          .from('reviews')
          .select('location_id, rating')
          .eq('user_id', user.id)
          .in('location_id', topLocationIds)
      : Promise.resolve({ data: [] }),
  ])

  const reviewsByLocation = new Map<string, FriendReview[]>()
  for (const r of (reviewsData ?? []) as any[]) {
    const arr = reviewsByLocation.get(r.location_id) ?? []
    arr.push({ rating: r.rating, profile: r.profile })
    reviewsByLocation.set(r.location_id, arr)
  }

  const myRatingByLocation = new Map<string, string>(
    (myReviewsData ?? []).map((r: any) => [r.location_id, r.rating])
  )

  const hotSpots: HotSpot[] = topLocationIds.map((locId) => {
    const location = locationMeta.get(locId)!
    const friendIdSet = locationFriends.get(locId)!
    const friends = [...friendIdSet]
      .map((fid) => profileMap.get(fid))
      .filter(Boolean)
      .map((p) => ({ id: p!.id, full_name: p!.full_name, avatar_url: p!.avatar_url }))

    return {
      id: locId,
      name: location.name,
      photo_url: location.photo_url,
      friends,
      reviews: reviewsByLocation.get(locId) ?? [],
      myRating: (myRatingByLocation.get(locId) as HotSpot['myRating']) ?? null,
    }
  })

  return (
    <div className="flex flex-col gap-8 px-4 md:px-8 md:gap-10">

      {/* My friends travel plans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
            My friends travel plans
          </h2>
          <Link href="/friends" className="text-xs font-medium text-[#ff5a1f]">
            See all
          </Link>
        </div>

        {friendPreviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No friends have added trips yet</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-5">
              {friendPreviews.slice(0, 6).map((friend) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <UserAvatar avatarUrl={friend.avatar_url} fullName={friend.full_name} size="lg" />
                  <p className="w-full truncate text-center text-sm font-semibold text-[#1a1a1a]">
                    {friend.full_name}
                  </p>
                  {friend.currentLocation ? (
                    <div className="flex w-full flex-col items-center gap-0.5">
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                        Now
                      </span>
                      <p className="w-full truncate text-center text-[11px] text-gray-500">
                        {friend.currentLocation}
                      </p>
                    </div>
                  ) : friend.nextLocation ? (
                    <div className="flex w-full flex-col items-center gap-0.5">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                        Next
                      </span>
                      <p className="w-full truncate text-center text-[11px] text-gray-500">
                        {friend.nextLocation}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-300">No trips</p>
                  )}
                </Link>
              ))}
            </div>

            {friendPreviews.length > 6 && (
              <Link
                href="/friends"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50"
              >
                See all friends
              </Link>
            )}
          </>
        )}
      </section>

      {/* The hot spots */}
      {hotSpots.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
            The hot spots
          </h2>
          <HotSpotsSection hotSpots={hotSpots} />
        </section>
      )}

    </div>
  )
}
