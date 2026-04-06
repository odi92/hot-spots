'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Search, User } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Feed' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const AUTH_ROUTES = ['/login', '/register']

export default function BottomNav() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-lg items-center px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-[#ff5a1f]' : 'text-gray-400'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-[#ff5a1f]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
