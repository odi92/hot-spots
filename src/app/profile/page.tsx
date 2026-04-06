import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AvatarUpload from './AvatarUpload'
import FriendRequests from './FriendRequests'
import { Trip, Location, Profile } from '@/types'
import { MapPin, Plus, Pencil } from 'lucide-react'
import LocationReviews, { type FriendReview } from '@/components/LocationReviews'

type TripWithLocation = Trip & { location: Location }

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tripsData }, { data: requestsData }, { data: friendshipsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('trips')
      .select('*, location:locations(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('friendships')
      .select('id, requester:profiles!requester_id(*)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ])

  const trips = (tripsData ?? []) as TripWithLocation[]
  const currentTrip = trips.find((t) => t.is_current)
  const incomingRequests = (requestsData ?? []).map((req: any) => ({
  id: req.id,
  requester: Array.isArray(req.requester) ? req.requester[0] : req.requester,
})).filter((req) => req.requester)
    .filter((r) => r.requester?.[0])
    .map((r) => ({ id: r.id, requester: r.requester[0] }))
  const friendIds = (friendshipsData ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  const locationIds = [...new Set(trips.map((t) => t.location_id))]
  const reviewsByLocation = new Map<string, FriendReview[]>()
  if (locationIds.length > 0) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('location_id, rating, profile:profiles(id, full_name, avatar_url)')
      .in('location_id', locationIds)
      .in('user_id', [...friendIds, user.id])
    for (const r of (reviewsData ?? []) as any[]) {
      const arr = reviewsByLocation.get(r.location_id) ?? []
      arr.push({ rating: r.rating, profile: r.profile })
      reviewsByLocation.set(r.location_id, arr)
    }
  }

  return (
    <div className="flex flex-col flex-1">

      <div className="flex flex-col gap-6 px-4 md:px-8 md:gap-8">
        <FriendRequests requests={incomingRequests} />

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? '?'}
          />
          <div className="text-center">
            <p className="text-lg font-bold text-[#1a1a1a]">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {profile?.status && (
              <p className="mt-1 text-sm text-gray-600">{profile.status}</p>
            )}
          </div>
          {currentTrip && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <MapPin size={12} />
              Currently in {currentTrip.location.name}
            </div>
          )}

          <Link
            href="/profile/edit"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#ff5a1f]"
          >
            <Pencil size={12} />
            Edit profile
          </Link>
        </div>

        {/* Trips */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
              My trips
            </h2>
            <Link href="/profile/add-trip" className="flex items-center gap-1 text-xs font-medium text-[#ff5a1f]">
              <Plus size={14} />
              Add trip
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-8 text-center shadow-sm">
              <span className="text-3xl">✈️</span>
              <p className="text-sm text-gray-500">No trips yet. Add your first one!</p>
              <Link
                href="/profile/add-trip"
                className="mt-1 rounded-xl bg-[#ff5a1f] px-5 py-2 text-sm font-semibold text-white"
              >
                Add trip
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trips.map((trip) => (
                <div key={trip.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <MapPin size={16} className="shrink-0 text-[#ff5a1f]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/locations/${trip.location_id}`} className="truncate text-sm font-semibold text-[#1a1a1a] hover:text-[#ff5a1f]">
                        {trip.location.name}
                      </Link>
                      <LocationReviews reviews={reviewsByLocation.get(trip.location_id) ?? []} />
                    </div>
                    {trip.arriving_on && (
                      <p className="text-xs text-gray-500">
                        {formatDate(trip.arriving_on)}
                        {trip.leaving_on && ` – ${formatDate(trip.leaving_on)}`}
                      </p>
                    )}
                  </div>
                  {trip.is_current && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                      Now
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
