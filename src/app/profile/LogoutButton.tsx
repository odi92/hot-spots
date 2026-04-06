'use client'

import { useTransition } from 'react'
import { logout } from './actions'

export default function LogoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(logout)}
      disabled={pending}
      className="text-sm font-medium text-gray-500 disabled:opacity-50"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
