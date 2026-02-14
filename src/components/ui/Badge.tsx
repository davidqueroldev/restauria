import { HTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default:
        'border-transparent bg-indigo-600 text-white hover:bg-indigo-700',
      secondary:
        'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
      destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
      outline: 'text-gray-950 border-gray-200',
      success: 'border-transparent bg-green-600 text-white hover:bg-green-700',
      warning:
        'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
