import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface MultipleFileUploadProps {
  onFilesSelect: (files: File[]) => void
  onFilesRemove: () => void
  currentFiles: (string | null | undefined)[]
  disabled?: boolean
  maxFiles?: number
  className?: string
}

export default function MultipleFileUpload({
  onFilesSelect,
  onFilesRemove,
  currentFiles = [],
  disabled = false,
  maxFiles = 10,
  className = ''
}: MultipleFileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelect(acceptedFiles)
    }
  }, [onFilesSelect])

  // Filter out non-string and empty values
  const validFiles = currentFiles.filter((file): file is string => 
    typeof file === 'string' && file.length > 0 && file.trim() !== ''
  )

  const { getRootProps, getInputProps, isDragReject, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: maxFiles - validFiles.length,
    disabled,
    noClick: true,
    noKeyboard: false
  })

  const handleRemoveImage = (index: number) => {
    // This would need to be implemented to remove specific images
    // For now, we'll just call the general remove function
    onFilesRemove()
  }

  const getCompleteUrl = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null
    
    const trimmedUrl = url.trim()
    if (trimmedUrl.length === 0) return null
    
    if (trimmedUrl.startsWith('http')) {
      // Convert absolute URL to relative URL for proxy
      try {
        const urlObj = new URL(trimmedUrl)
        return urlObj.pathname
      } catch (error) {
        return trimmedUrl
      }
    }
    
    if (trimmedUrl.startsWith('/uploads/')) return trimmedUrl
    
    return trimmedUrl
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Images Preview */}
      {validFiles.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Hình ảnh hiện tại ({validFiles.length}/{maxFiles})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {validFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={getCompleteUrl(file) || ''}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/assets/img/no-product.png'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {validFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!disabled) {
              open()
            }
          }}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : isDragReject 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!disabled) {
                    open()
                  }
                }}
                className="font-medium text-blue-600 hover:text-blue-500 underline"
                disabled={disabled}
              >
                Nhấp để tải lên
              </button>
              {' '}hoặc kéo thả hình ảnh vào đây
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WEBP tối đa {maxFiles - validFiles.length} hình ảnh
            </p>
          </div>
        </div>
      )}

      {/* File Count Info */}
      <div className="text-sm text-gray-500">
        {validFiles.length > 0 && (
          <span>
            Đã chọn {validFiles.length}/{maxFiles} hình ảnh
          </span>
        )}
        {validFiles.length === 0 && (
          <span>Chưa có hình ảnh nào được chọn</span>
        )}
      </div>
    </div>
  )
}
