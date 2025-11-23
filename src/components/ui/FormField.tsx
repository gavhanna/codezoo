import React from 'react'

type FormFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: React.HTMLInputTypeAttribute
  autoComplete?: string
  placeholder?: string
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  placeholder,
}: FormFieldProps) {
  return (
    <label className="block text-sm font-medium space-y-2">
      <span>{label}</span>
      <input
        required
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full px-4 py-3 rounded-2xl bg-slate-950/70 border ${
          error ? 'border-red-500' : 'border-white/10'
        } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  )
}
