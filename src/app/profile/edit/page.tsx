import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditProfileForm from './EditProfileForm'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/profile')

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-3 px-4 pb-2">
        <Link
          href="/profile"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-[#1a1a1a]">Edit profile</h1>
      </div>

      <EditProfileForm profile={profile} email={user.email ?? ''} userId={user.id} />
    </div>
  )
}
