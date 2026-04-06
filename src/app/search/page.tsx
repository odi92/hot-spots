import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SearchClient from './SearchClient'

export default async function SearchPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current user's friendship state so the client can show correct buttons
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  return (
    <div className="flex flex-col flex-1">

      <SearchClient currentUserId={user.id} initialFriendships={friendships ?? []} />

    </div>
  )
}
