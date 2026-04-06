'use client'

import { useTransition } from 'react'
import { acceptFriendRequest, rejectFriendRequest } from './actions'
import { Profile } from '@/types'
import UserAvatar from '@/components/UserAvatar'

type Request = {
  id: string
  requester: Profile
}

export default function FriendRequests({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Friend requests
      </h2>
      <div className="flex flex-col gap-2">
        {requests.map((req) => (
          <RequestRow key={req.id} request={req} />
        ))}
      </div>
    </section>
  )
}

function RequestRow({ request }: { request: Request }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <UserAvatar avatarUrl={request.requester.avatar_url} fullName={request.requester.full_name} size="md" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1a1a1a]">
        {request.requester.full_name}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => startTransition(() => acceptFriendRequest(request.id))}
          disabled={pending}
          className="rounded-lg bg-[#ff5a1f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={() => startTransition(() => rejectFriendRequest(request.id))}
          disabled={pending}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
