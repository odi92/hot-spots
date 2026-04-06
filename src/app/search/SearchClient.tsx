'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { sendFriendRequest } from './actions'
import { Profile } from '@/types'
import { Search, UserPlus, Check, Clock, MapPin } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'

type Friendship = {
  requester_id: string
  addressee_id: string
  status: string
}

type LocationResult = {
  id: string
  name: string
  photo_url: string | null
}

type Props = {
  currentUserId: string
  initialFriendships: Friendship[]
}

export default function SearchClient({ currentUserId, initialFriendships }: Props) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [locations, setLocations] = useState<LocationResult[]>([])
  const [searching, setSearching] = useState(false)
  const [friendships, setFriendships] = useState(initialFriendships)
  const [pending, startTransition] = useTransition()

  async function handleSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 2) {
      setUsers([])
      setLocations([])
      return
    }

    setSearching(true)
    const supabase = createClient()

    const [{ data: usersData }, { data: locationsData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${value}%`)
        .neq('id', currentUserId)
        .limit(10),
      supabase
        .from('locations')
        .select('id, name, photo_url')
        .ilike('name', `%${value}%`)
        .limit(10),
    ])

    setUsers(usersData ?? [])
    setLocations(locationsData ?? [])
    setSearching(false)
  }

  function getFriendshipStatus(profileId: string) {
    const f = friendships.find(
      (f) =>
        (f.requester_id === currentUserId && f.addressee_id === profileId) ||
        (f.addressee_id === currentUserId && f.requester_id === profileId)
    )
    if (!f) return null
    return { status: f.status, isSender: f.requester_id === currentUserId }
  }

  function handleAddFriend(profileId: string) {
    startTransition(async () => {
      await sendFriendRequest(profileId)
      setFriendships((prev) => [
        ...prev,
        { requester_id: currentUserId, addressee_id: profileId, status: 'pending' },
      ])
    })
  }

  const hasResults = users.length > 0 || locations.length > 0
  const noResults = !searching && query.length >= 2 && !hasResults

  return (
    <div className="flex flex-col gap-4 px-4 md:px-8 md:gap-6">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search people or places…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
        />
      </div>

      {searching && (
        <p className="text-center text-sm text-gray-400">Searching…</p>
      )}

      {noResults && (
        <p className="text-center text-sm text-gray-400">No results found</p>
      )}

      {/* Users section */}
      {users.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            People
          </h2>
          {users.map((profile) => {
            const friendship = getFriendshipStatus(profile.id)
            return (
              <div key={profile.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <UserAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} size="md" />
                <Link href={`/friends/${profile.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1a1a1a]">{profile.full_name}</p>
                </Link>
                {!friendship && (
                  <button
                    onClick={() => handleAddFriend(profile.id)}
                    disabled={pending}
                    className="flex items-center gap-1 rounded-lg bg-[#ff5a1f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <UserPlus size={13} />
                    Add
                  </button>
                )}
                {friendship?.status === 'pending' && friendship.isSender && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={13} />
                    Pending
                  </span>
                )}
                {friendship?.status === 'accepted' && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Check size={13} />
                    Friends
                  </span>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Locations section */}
      {locations.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Places
          </h2>
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={`/locations/${loc.id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50"
            >
              {loc.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={loc.photo_url}
                  alt={loc.name}
                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <MapPin size={16} className="text-gray-400" />
                </div>
              )}
              <p className="truncate text-sm font-semibold text-[#1a1a1a]">{loc.name}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
