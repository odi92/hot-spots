'use client'

import { useActionState } from 'react'
import { updateProfile, changePassword } from './actions'
import { Profile } from '@/types'
import AvatarUpload from '@/app/profile/AvatarUpload'

type Props = {
  profile: Profile
  email: string
  userId: string
}

const inputClass =
  'rounded-xl border border-gray-200 bg-[#f9f9f7] px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20'

export default function EditProfileForm({ profile, email, userId }: Props) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, null)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, null)

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 md:gap-8">
      {/* Profile info */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Profile info
        </h2>
        <form action={profileAction} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <AvatarUpload
            userId={userId}
            avatarUrl={profile.avatar_url ?? null}
            fullName={profile.full_name}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="full_name" className="text-sm font-medium text-[#1a1a1a]">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={profile.full_name}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium text-[#1a1a1a]">
              Status <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="status"
              name="status"
              type="text"
              defaultValue={profile.status ?? ''}
              placeholder="e.g. Exploring Southeast Asia"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-400">Email</p>
            <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400">
              {email}
            </p>
          </div>

          {profileState === 'saved' && (
            <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">Saved</p>
          )}
          {profileState && profileState !== 'saved' && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{profileState}</p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {profilePending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Change password
        </h2>
        <form action={passwordAction} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm" className="text-sm font-medium text-[#1a1a1a]">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={6}
              placeholder="Repeat new password"
              className={inputClass}
            />
          </div>

          {passwordState === 'saved' && (
            <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
              Password updated
            </p>
          )}
          {passwordState && passwordState !== 'saved' && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{passwordState}</p>
          )}

          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {passwordPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
