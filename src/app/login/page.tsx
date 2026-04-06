'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from './actions'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff5a1f] text-2xl">
            🔥
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Hot Spots</h1>
          <p className="mt-2 text-sm text-gray-500">See where your friends are traveling</p>
        </div>

        <form action={action} className="flex flex-col gap-5">
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
              autoComplete="current-password"
              required
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          No account?{' '}
          <Link href="/register" className="font-medium text-[#ff5a1f]">
            Register
          </Link>
        </p>
      </div>
    </main>
  )
}
