interface Props {
  avatarUrl: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { wrap: 'h-9 w-9', text: 'text-sm' },
  md: { wrap: 'h-10 w-10', text: 'text-sm' },
  lg: { wrap: 'h-16 w-16', text: 'text-2xl' },
}

export default function UserAvatar({ avatarUrl, fullName, size = 'md' }: Props) {
  const { wrap, text } = sizes[size]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${wrap} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`${wrap} ${text} flex shrink-0 items-center justify-center rounded-full bg-[#ff5a1f]/10 font-bold text-[#ff5a1f]`}
    >
      {fullName.charAt(0).toUpperCase()}
    </div>
  )
}
