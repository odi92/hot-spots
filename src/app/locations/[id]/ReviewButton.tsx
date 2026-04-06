'use client'

import { useState, useTransition } from 'react'
import { upsertReview } from './actions'
import { RATINGS } from '@/types'

type Props = {
  locationId: string
  currentRating: 'good' | 'meh' | 'not_good' | null
}

export default function ReviewButton({ locationId, currentRating }: Props) {
  const [selected, setSelected] = useState<string | null>(currentRating)
  const [pending, startTransition] = useTransition()

  function handleRate(value: 'good' | 'meh' | 'not_good') {
    setSelected(value)
    startTransition(async () => { await upsertReview(locationId, value) })
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-gray-500">Your rating</p>
      <div className="flex gap-3">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRate(r.value)}
            disabled={pending}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-sm transition-colors ${
              selected === r.value
                ? 'bg-[#ff5a1f] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-60`}
          >
            <span className="text-lg">{r.emoji}</span>
            <span className="text-[10px] font-medium">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
