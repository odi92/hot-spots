import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let initialized = false

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    v: 'weekly',
  })
}

let placesLibPromise: Promise<google.maps.PlacesLibrary> | null = null

export function getPlacesLib(): Promise<google.maps.PlacesLibrary> {
  if (!placesLibPromise) {
    ensureInitialized()
    placesLibPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>
  }
  return placesLibPromise
}
