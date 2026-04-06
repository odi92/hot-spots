'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { upsertReview } from '@/app/locations/[id]/actions'
import { type FriendReview } from '@/components/LocationReviews'
import UserAvatar from '@/components/UserAvatar'

export type HotSpot = {
  id: string
  name: string
  photo_url: string | null
  friends: { id: string; full_name: string; avatar_url: string | null }[]
  reviews: FriendReview[]
  myRating: 'good' | 'meh' | 'not_good' | null
}

const RATINGS = [
  { value: 'good' as const, emoji: '🔥' },
  { value: 'meh' as const, emoji: '😐' },
  { value: 'not_good' as const, emoji: '👎' },
]

// Emoji + count + vote button for a single rating type
function RatingButton({
  emoji,
  count,
  selected,
  pending,
  onClick,
}: {
  emoji: string
  count: number
  selected: boolean
  pending: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
        selected
          ? 'bg-[#ff5a1f]/10 font-semibold text-[#ff5a1f]'
          : 'hover:bg-gray-100 text-gray-500'
      }`}
    >
      <span className="text-sm leading-none">{emoji}</span>
      {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
    </button>
  )
}

// Friend count badge with click-to-reveal tooltip
function FriendsBadge({
  friends,
}: {
  friends: HotSpot['friends']
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-200"
      >
        👥 {friends.length}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 flex min-w-36 flex-col gap-1.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-lg">
          {friends.map((f) => (
            <Link key={f.id} href={`/friends/${f.id}`} className="flex items-center gap-1.5">
              <UserAvatar avatarUrl={f.avatar_url} fullName={f.full_name} size="sm" />
              <span className="truncate text-xs text-gray-700">{f.full_name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Single hot spot card
function HotSpotCard({ spot }: { spot: HotSpot }) {
  const [myRating, setMyRating] = useState(spot.myRating)
  const [pending, startTransition] = useTransition()

  function handleRate(value: 'good' | 'meh' | 'not_good') {
    setMyRating(value)
    startTransition(async () => { await upsertReview(spot.id, value) })
  }

  const countFor = (v: string) => spot.reviews.filter((r) => r.rating === v).length

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <Link href={`/locations/${spot.id}`}>
        {spot.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spot.photo_url}
            alt={spot.name}
            className="h-24 w-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-full items-center justify-center bg-gray-100">
            <MapPin size={20} className="text-gray-300" />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-1.5 p-3">
        <Link
          href={`/locations/${spot.id}`}
          className="truncate text-sm font-semibold text-[#1a1a1a] hover:text-[#ff5a1f]"
        >
          {spot.name}
        </Link>

        <div className="flex items-center justify-between gap-1">
          {spot.friends.length > 0 && <FriendsBadge friends={spot.friends} />}

          <div className="flex items-center gap-0.5">
            {RATINGS.map((r) => (
              <RatingButton
                key={r.value}
                emoji={r.emoji}
                count={countFor(r.value)}
                selected={myRating === r.value}
                pending={pending}
                onClick={() => handleRate(r.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type SearchResult = { id: string; name: string; photo_url: string | null }

export default function HotSpotsSection({ hotSpots }: { hotSpots: HotSpot[] }) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('locations')
      .select('id, name, photo_url')
      .ilike('name', `%${value}%`)
      .limit(9)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {hotSpots.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {hotSpots.map((spot) => (
            <HotSpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}

      {/* Search for more */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for more hot spots…"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
          />
        </div>

        {searching && (
          <p className="text-center text-sm text-gray-400">Searching…</p>
        )}

        {!searching && query.length >= 2 && searchResults.length === 0 && (
          <p className="text-center text-sm text-gray-400">No locations found</p>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {searchResults.map((loc) => (
              <Link
                key={loc.id}
                href={`/locations/${loc.id}`}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden active:bg-gray-50"
              >
                {loc.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={loc.photo_url} alt={loc.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center bg-gray-100">
                    <MapPin size={20} className="text-gray-300" />
                  </div>
                )}
                <p className="truncate p-3 text-sm font-semibold text-[#1a1a1a]">{loc.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
