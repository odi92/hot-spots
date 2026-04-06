import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Trip, Profile, Review } from '@/types'
import { RATINGS } from '@/types'
import { MapPin, ChevronLeft } from 'lucide-react'
import ReviewButton from './ReviewButton'
import UserAvatar from '@/components/UserAvatar'
import LocationReviews, { type FriendReview } from '@/components/LocationReviews'

type TripWithProfile = Trip & { profile: Profile }
type ReviewWithProfile = Review & { profile: Profile }

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: location }, { data: tripsData }, { data: reviewsData }, { data: friendshipsData }] = await Promise.all([
    supabase.from('locations').select('*').eq('id', id).single(),
    supabase
      .from('trips')
      .select('*, profile:profiles(*)')
      .eq('location_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('*, profile:profiles(*)')
      .eq('location_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ])

  if (!location) notFound()

  const trips = (tripsData ?? []) as TripWithProfile[]
  const reviews = (reviewsData ?? []) as ReviewWithProfile[]
  const currentVisitors = trips.filter((t) => t.is_current)
  const myReview = reviews.find((r) => r.user_id === user.id)

  const friendIds = new Set(
    (friendshipsData ?? []).map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    )
  )
  friendIds.add(user.id)
  const friendReviews: FriendReview[] = reviews
    .filter((r) => friendIds.has(r.user_id))
    .map((r) => ({ rating: r.rating, profile: r.profile }))

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-3 px-4 pb-2">
        <Link href="/" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="truncate text-lg font-bold text-[#1a1a1a] md:text-xl">{location.name}</h1>
      </div>

      {/* Hero photo */}
      <div className="md:px-8">
        {location.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={location.photo_url}
            alt={location.name}
            className="h-52 w-full object-cover md:rounded-2xl md:h-64"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-gray-100 md:rounded-2xl md:h-64">
            <MapPin size={32} className="text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 px-4 md:px-8 md:gap-8">
        {/* Location card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={15} className="text-[#ff5a1f]" />
            <span>{location.name}</span>
          </div>

          <LocationReviews reviews={friendReviews} />

          <ReviewButton locationId={id} currentRating={myReview?.rating ?? null} />
        </div>

        {/* Current visitors */}
        {currentVisitors.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
              Here now
            </h2>
            <div className="flex flex-col gap-3">
              {currentVisitors.map((trip) => (
                <Link key={trip.id} href={`/friends/${trip.user_id}`}>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <UserAvatar avatarUrl={trip.profile.avatar_url} fullName={trip.profile.full_name} size="sm" />
                    <p className="text-sm font-semibold text-[#1a1a1a]">{trip.profile.full_name}</p>
                    <span className="ml-auto shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                      Now
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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
                      <Link href={`/friends/${review.user_id}`} className="text-sm font-semibold text-[#1a1a1a] hover:text-[#ff5a1f]">
                        {review.profile.full_name}
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
