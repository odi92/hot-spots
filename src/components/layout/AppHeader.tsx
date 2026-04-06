'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Menu } from 'lucide-react'
import { logout } from '@/app/profile/actions'

const AUTH_ROUTES = ['/login', '/register']

export default function AppHeader() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-[#f9f9f7]/80 px-4 pt-12 pb-4 backdrop-blur-md md:px-8 md:pt-5 md:pb-5">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl leading-none">🔥</span>
        <span className="text-lg font-bold text-[#1a1a1a] md:text-xl">Hot Spots</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/profile/add-trip"
          className="flex items-center gap-1.5 rounded-xl bg-[#ff5a1f] px-3 py-2 text-xs font-semibold text-white md:px-4 md:py-2.5 md:text-sm"
        >
          <Plus size={14} />
          Add trip
        </Link>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-md">
              {[
                { href: '/friends', label: 'All friends' },
                { href: '/profile', label: 'My profile' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {label}
                </Link>
              ))}
              <div className="my-1 border-t border-gray-100" />
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
