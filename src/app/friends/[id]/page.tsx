import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Trip, Location, Review } from '@/types'
import { RATINGS } from '@/types'
import { MapPin, ChevronLeft } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'
import LocationReviews, { type FriendReview } from '@/components/LocationReviews'

type TripWithLocation = Trip & { location: Location }
type ReviewWithLocation = Review & { location: Location }

export default async function FriendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tripsData }, { data: reviewsData }, { data: friendshipsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('trips')
      .select('*, location:locations(*)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('*, location:locations(*)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ])

  if (!profile) notFound()

  const trips = (tripsData ?? []) as TripWithLocation[]
  const reviews = (reviewsData ?? []) as ReviewWithLocation[]
  const currentTrip = trips.find((t) => t.is_current)
  const friendIds = (friendshipsData ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  // Fetch friend reviews for all visible trip locations
  const locationIds = [...new Set(trips.map((t) => t.location_id))]
  const reviewsByLocation = new Map<string, FriendReview[]>()
  if (locationIds.length > 0) {
    const { data: locReviewsData } = await supabase
      .from('reviews')
      .select('location_id, rating, profile:profiles(id, full_name, avatar_url)')
      .in('location_id', locationIds)
      .in('user_id', [...friendIds, user.id])
    for (const r of (locReviewsData ?? []) as any[]) {
      const arr = reviewsByLocation.get(r.location_id) ?? []
      arr.push({ rating: r.rating, profile: r.profile })
      reviewsByLocation.set(r.location_id, arr)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-3 px-4 pb-2">
        <Link href="/" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-[#1a1a1a] md:text-xl">{profile.full_name}</h1>
      </div>

      <div className="flex flex-col gap-6 px-4 md:px-8 md:gap-8">
        {/* Profile card */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <UserAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} size="lg" />
          <div className="text-center">
            <p className="text-lg font-bold text-[#1a1a1a]">{profile.full_name}</p>
            {profile.status && (
              <p className="mt-1 text-sm text-gray-500">{profile.status}</p>
            )}
          </div>
          {currentTrip && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <MapPin size={12} />
              Currently in {currentTrip.location.name}
            </div>
          )}
        </div>

        {/* Trips */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Trips
          </h2>
          {trips.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No trips yet</p>
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

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
              Reviews
            </h2>
            <div className="flex flex-col gap-3">
              {reviews.map((review) => {
                const rating = RATINGS.find((r) => r.value === review.rating)
                return (
                  <div key={review.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <span className="text-xl">{rating?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/locations/${review.location_id}`} className="truncate text-sm font-semibold text-[#1a1a1a] hover:text-[#ff5a1f]">
                        {review.location.name}
                      </Link>
                      <p className="text-xs text-gray-500">{rating?.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
