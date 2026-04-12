import * as icons from 'lucide-react'

interface CategoryIconProps extends React.SVGProps<SVGSVGElement> {
  name: string
  className?: string
  style?: React.CSSProperties
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (icons as any)[name]
  if (!Icon) return <icons.CircleDot {...props} />
  return <Icon {...props} />
}
