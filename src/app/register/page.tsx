'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register, type RegisterState } from './actions'
import { createClient } from '@/lib/supabase/client'
import { updateAvatar } from '@/app/profile/actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, null)
  const router = useRouter()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // After successful registration, upload avatar (if any) then redirect
  useEffect(() => {
    if (state?.type !== 'success') return
    const userId = state.userId

    async function finish() {
      if (avatarFile) {
        try {
          const supabase = createClient()
          const ext = avatarFile.name.split('.').pop() ?? 'jpg'
          const path = `${userId}/avatar.${ext}`
          const { error } = await supabase.storage
            .from('avatars')
            .upload(path, avatarFile, { upsert: true })
          if (!error) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(path)
            await updateAvatar(data.publicUrl)
          }
        } catch {
          // Avatar upload is optional — proceed even if it fails
        }
      }
      router.push('/')
    }

    finish()
  }, [state])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  if (state?.type === 'confirm') {
    return (
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center text-5xl">✉️</div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Check your email</h1>
          <p className="mt-3 text-sm text-gray-500">{state.message}</p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-[#ff5a1f] px-8 py-3 text-sm font-semibold text-white"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff5a1f] text-2xl">
            🔥
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">Join and share where you travel</p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-16 w-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f]"
              aria-label="Add profile photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[11px] font-semibold text-white">
                  {avatarPreview ? 'Edit' : 'Add'}
                </span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-gray-400">Profile photo (optional)</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="full_name" className="text-sm font-medium text-[#1a1a1a]">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              autoComplete="name"
              required
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
              placeholder="Min. 6 characters"
            />
          </div>

          {state?.type === 'error' && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#ff5a1f]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
