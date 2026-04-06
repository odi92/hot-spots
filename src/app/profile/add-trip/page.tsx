'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { addTrip } from './actions'
import PlaceAutocomplete, { type PlaceSelection } from './PlaceAutocomplete'

export default function AddTripPage() {
  const [error, action, pending] = useActionState(addTrip, null)
  const [place, setPlace] = useState<PlaceSelection | null>(null)

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-3 px-4 pb-2">
        <Link
          href="/profile"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-[#1a1a1a]">Add trip</h1>
      </div>

      <form action={action} className="flex flex-col gap-4 px-4">
        {/* Carries the selected place data to the server action */}
        <input type="hidden" name="place_name" value={place?.name ?? ''} />
        <input type="hidden" name="google_place_id" value={place?.placeId ?? ''} />
        <input type="hidden" name="photo_url" value={place?.photoUrl ?? ''} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#1a1a1a]">Place</label>
          <PlaceAutocomplete onSelect={setPlace} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="arriving_on" className="text-sm font-medium text-[#1a1a1a]">
              Arriving
            </label>
            <input
              id="arriving_on"
              type="date"
              name="arriving_on"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="leaving_on" className="text-sm font-medium text-[#1a1a1a]">
              Leaving
            </label>
            <input
              id="leaving_on"
              type="date"
              name="leaving_on"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[#1a1a1a]">Date type</p>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium has-[:checked]:border-[#ff5a1f] has-[:checked]:bg-[#ff5a1f]/5 has-[:checked]:text-[#ff5a1f]">
              <input type="radio" name="date_type" value="exact" defaultChecked className="accent-[#ff5a1f]" />
              Exact
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium has-[:checked]:border-[#ff5a1f] has-[:checked]:bg-[#ff5a1f]/5 has-[:checked]:text-[#ff5a1f]">
              <input type="radio" name="date_type" value="flexible" className="accent-[#ff5a1f]" />
              Flexible
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[#1a1a1a]">Status</p>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium has-[:checked]:border-[#ff5a1f] has-[:checked]:bg-[#ff5a1f]/5 has-[:checked]:text-[#ff5a1f]">
              <input type="radio" name="is_current" value="true" className="accent-[#ff5a1f]" />
              I&apos;m here now
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium has-[:checked]:border-[#ff5a1f] has-[:checked]:bg-[#ff5a1f]/5 has-[:checked]:text-[#ff5a1f]">
              <input type="radio" name="is_current" value="false" defaultChecked className="accent-[#ff5a1f]" />
              Past / upcoming
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending || !place}
          className="mt-2 rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save trip'}
        </button>
      </form>
    </div>
  )
}
