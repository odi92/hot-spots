'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { getPlacesLib } from '@/lib/google-maps'

function fetchPlacePhoto(
  lib: google.maps.PlacesLibrary,
  placeId: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const service = new lib.PlacesService(document.createElement('div'))
    service.getDetails(
      { placeId, fields: ['photos'] },
      (result, status) => {
        if (status === lib.PlacesServiceStatus.OK && result?.photos?.[0]) {
          resolve(result.photos[0].getUrl({ maxWidth: 800 }))
        } else {
          resolve(null)
        }
      },
    )
  })
}

export type PlaceSelection = {
  name: string
  placeId: string
  photoUrl: string | null
}

type Suggestion = {
  mainText: string
  secondaryText: string | null
  fullText: string
  prediction: google.maps.places.PlacePrediction
}

export default function PlaceAutocomplete({
  onSelect,
}: {
  onSelect: (place: PlaceSelection | null) => void
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [fetchingPhoto, setFetchingPhoto] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  async function handleInput(value: string) {
    setQuery(value)
    setConfirmed(false)
    setError(null)
    onSelect(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const lib = await getPlacesLib()
        const { suggestions: raw } =
          await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: value })

        setSuggestions(
          (raw ?? [])
            .filter((s) => s.placePrediction)
            .map((s) => {
              const p = s.placePrediction!
              return {
                mainText: p.mainText?.text ?? p.text.text,
                secondaryText: p.secondaryText?.text ?? null,
                fullText: p.text.text,
                prediction: p,
              }
            })
        )
      } catch (e) {
        console.error('[PlaceAutocomplete] fetchAutocompleteSuggestions failed:', e)
        setError('Could not load suggestions. Check the browser console for details.')
        setSuggestions([])
      }
    }, 300)
  }

  async function handleSelect(suggestion: Suggestion) {
    setSuggestions([])
    setQuery(suggestion.fullText)
    setFetchingPhoto(true)

    let photoUrl: string | null = null
    try {
      const lib = await getPlacesLib()
      photoUrl = await fetchPlacePhoto(lib, suggestion.prediction.placeId)
    } catch (e) {
      console.warn('[PlaceAutocomplete] photo fetch failed (non-fatal):', e)
    }

    setFetchingPhoto(false)
    setConfirmed(true)
    onSelect({ name: suggestion.fullText, placeId: suggestion.prediction.placeId, photoUrl })
  }

  function handleClear() {
    setQuery('')
    setConfirmed(false)
    setSuggestions([])
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="e.g. Tokyo, Japan"
          autoComplete="off"
          className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#ff5a1f]/20 ${
            confirmed
              ? 'border-[#ff5a1f] bg-[#ff5a1f]/5'
              : 'border-gray-200 bg-white focus:border-[#ff5a1f]'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {fetchingPhoto && (
        <p className="mt-1 px-1 text-xs text-gray-400">Loading…</p>
      )}

      {error && (
        <p className="mt-1 px-1 text-xs text-red-500">{error}</p>
      )}

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              // onMouseDown prevents the input blur from closing the dropdown before click fires
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-[#1a1a1a]">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-xs text-gray-400">{s.secondaryText}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
