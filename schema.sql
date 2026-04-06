-- Hot Spots schema
-- Run this in the Supabase SQL editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  status text,
  created_at timestamptz default now() not null
);

-- Locations
create table locations (
  id uuid default gen_random_uuid() primary key,
  google_place_id text not null unique,
  name text not null,
  photo_url text,
  created_at timestamptz default now() not null
);

-- Trips
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  location_id uuid references locations(id) not null,
  arriving_on date,
  leaving_on date,
  date_type text check (date_type in ('exact', 'flexible')) default 'exact',
  is_current boolean default false,
  created_at timestamptz default now() not null
);

-- Reviews
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  location_id uuid references locations(id) not null,
  rating text check (rating in ('good', 'meh', 'not_good')) not null,
  created_at timestamptz default now() not null,
  unique(user_id, location_id)
);

-- Friendships
create table friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamptz default now() not null,
  unique(requester_id, addressee_id)
);

-- Enable RLS
alter table profiles enable row level security;
alter table locations enable row level security;
alter table trips enable row level security;
alter table reviews enable row level security;
alter table friendships enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Locations policies (shared resource)
create policy "Locations are viewable by everyone" on locations for select using (true);
create policy "Authenticated users can insert locations" on locations for insert with check (auth.role() = 'authenticated');

-- Trips policies
create policy "Trips are viewable by everyone" on trips for select using (true);
create policy "Users can insert own trips" on trips for insert with check (auth.uid() = user_id);
create policy "Users can update own trips" on trips for update using (auth.uid() = user_id);
create policy "Users can delete own trips" on trips for delete using (auth.uid() = user_id);

-- Reviews policies
create policy "Reviews are viewable by everyone" on reviews for select using (true);
create policy "Users can insert own reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on reviews for delete using (auth.uid() = user_id);

-- Friendships policies
create policy "Friendships viewable by participants" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on friendships for insert with check (auth.uid() = requester_id);
create policy "Addressee can accept/decline" on friendships for update using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Participants can delete friendship" on friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
