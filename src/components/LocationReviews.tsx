'use client'

import { useState, useRef, useEffect } from 'react'

export type FriendReview = {
  rating: 'good' | 'meh' | 'not_good'
  profile: { id: string; full_name: string; avatar_url: string | null }
}

const EMOJI: Record<string, string> = { good: '🔥', meh: '😐', not_good: '👎' }
const ORDER = ['good', 'meh', 'not_good'] as const

export default function LocationReviews({ reviews = [] }: { reviews?: FriendReview[] }) {
  const [activeRating, setActiveRating] = useState<string | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!activeRating) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setActiveRating(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [activeRating])

  const groups = ORDER.map((rating) => ({
    rating,
    reviewers: reviews.filter((r) => r.rating === rating).map((r) => r.profile),
  })).filter((g) => g.reviewers.length > 0)

  if (groups.length === 0) return null

  const activeGroup = groups.find((g) => g.rating === activeRating) ?? null

  return (
    <span ref={ref} className="relative flex items-center gap-1">
      {groups.map(({ rating, reviewers }) => (
        <button
          key={rating}
          type="button"
          onClick={() => setActiveRating(activeRating === rating ? null : rating)}
          className="flex items-center gap-0.5 rounded-md px-1 py-0.5 hover:bg-gray-100 active:bg-gray-100"
        >
          <span className="text-xs leading-none">{EMOJI[rating]}</span>
          <span className="text-[10px] font-semibold text-gray-400">{reviewers.length}</span>
        </button>
      ))}

      {activeGroup && (
        <span className="absolute bottom-full left-0 z-50 mb-1.5 flex min-w-36 flex-col gap-1.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-lg">
          {activeGroup.reviewers.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt={p.full_name}
                  className="h-5 w-5 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a1f]/10 text-[9px] font-bold text-[#ff5a1f]">
                  {p.full_name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate text-xs text-gray-700">{p.full_name}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
