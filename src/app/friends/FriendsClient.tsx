'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'
import LocationReviews, { type FriendReview } from '@/components/LocationReviews'

export type FriendWithTrips = {
  id: string
  full_name: string
  avatar_url: string | null
  currentLocation: string | null
  currentLocationId: string | null
  nextLocation: string | null
  nextLocationId: string | null
}

type Props = {
  friends: FriendWithTrips[]
  reviewsByLocation?: Record<string, FriendReview[]>
}

export default function FriendsClient({ friends, reviewsByLocation = {} }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim().length === 0
    ? friends
    : friends.filter((f) =>
        f.full_name.toLowerCase().includes(query.toLowerCase()) ||
        (f.currentLocation ?? '').toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className="flex flex-col gap-4 px-4 md:px-8 md:gap-6">
      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
        />
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
          <span className="text-4xl">👥</span>
          <p className="font-medium text-[#1a1a1a]">No friends yet</p>
          <p className="text-sm text-gray-500">
            Search for people to add as friends.
          </p>
          <Link
            href="/search"
            className="mt-2 rounded-xl bg-[#ff5a1f] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Find friends
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No friends match your search</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-5">
          {filtered.map((friend) => (
            <div
              key={friend.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <Link href={`/friends/${friend.id}`} className="flex flex-col items-center gap-2">
                <UserAvatar avatarUrl={friend.avatar_url} fullName={friend.full_name} size="lg" />
                <p className="w-full truncate text-center text-sm font-semibold text-[#1a1a1a]">
                  {friend.full_name}
                </p>
              </Link>

              {friend.currentLocation ? (
                <div className="flex w-full flex-col items-center gap-0.5">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    Now
                  </span>
                  <p className="w-full truncate text-center text-[11px] text-gray-500">
                    {friend.currentLocation}
                  </p>
                  <LocationReviews reviews={reviewsByLocation[friend.currentLocationId ?? ''] ?? []} />
                </div>
              ) : friend.nextLocation ? (
                <div className="flex w-full flex-col items-center gap-0.5">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                    Next
                  </span>
                  <p className="w-full truncate text-center text-[11px] text-gray-500">
                    {friend.nextLocation}
                  </p>
                  <LocationReviews reviews={reviewsByLocation[friend.nextLocationId ?? ''] ?? []} />
                </div>
              ) : (
                <p className="text-[11px] text-gray-300">No trips</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
