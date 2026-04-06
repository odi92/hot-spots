'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatar } from './actions'

interface Props {
  userId: string
  avatarUrl: string | null
  fullName: string
}

export default function AvatarUpload({ userId, avatarUrl, fullName }: Props) {
  const [displayUrl, setDisplayUrl] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Append timestamp so the browser doesn't serve the cached old image
      const freshUrl = `${data.publicUrl}?t=${Date.now()}`

      await updateAvatar(data.publicUrl)
      setDisplayUrl(freshUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative h-16 w-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f]"
        aria-label="Change profile photo"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={fullName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff5a1f]/10 text-2xl font-bold text-[#ff5a1f]">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-0">
          <span className="text-[11px] font-semibold text-white">
            {uploading ? '…' : 'Edit'}
          </span>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
