interface ProgressBarProps {
  value: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

const heights = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3'
}

export function ProgressBar({ 
  value, 
  color = '#3b82f6', 
  height = 'md',
  showLabel = false,
  animated = true
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{clampedValue}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ${heights[height]}`}>
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-700' : ''}`}
          style={{ 
            width: `${clampedValue}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}
