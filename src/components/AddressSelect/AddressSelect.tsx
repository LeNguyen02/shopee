import React from 'react'

interface AddressSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ code: string; name: string }>
  placeholder: string
  isLoading?: boolean
  errorMessage?: string
  name: string
}

export default function AddressSelect({
  value,
  onChange,
  options,
  placeholder,
  isLoading = false,
  errorMessage,
  name
}: AddressSelectProps) {
  return (
    <div>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xl ${
          errorMessage ? 'border-red-500' : ''
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      {errorMessage && (
        <div className="text-red-500 text-lg mt-1">{errorMessage}</div>
      )}
    </div>
  )
}

