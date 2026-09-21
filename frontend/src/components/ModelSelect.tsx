import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

interface ModelSelectProps {
  models: string[]
  selected: string
  onChange: (model: string) => void
  disabled?: boolean
}

export default function ModelSelect({ models, selected, onChange, disabled }: ModelSelectProps) {
  if (models.length === 0) return null

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg bg-white',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {models.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}