import config from 'src/constants/config'
import { Product } from 'src/types/product.type'

/**
 * Converts a relative image path to a full URL
 * @param imagePath - The image path (can be relative or absolute)
 * @returns Full URL for the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  
  // If it's already a full URL, convert to relative path for proxy
  if (imagePath.startsWith('http')) {
    try {
      const url = new URL(imagePath)
      return url.pathname // Return just the path part for proxy
    } catch {
      return imagePath
    }
  }
  
  // If it's a relative path starting with /uploads/, use it as is (Vite proxy will handle it)
  if (imagePath.startsWith('/uploads/')) {
    return imagePath
  }
  
  // If it's just a filename, assume it's in uploads/products
  return `/uploads/products/${imagePath}`
}

/**
 * Gets the main product image URL
 * @param product - The product object
 * @returns Main product image URL
 */
export const getMainProductImage = (product: Product): string => {
  // First try the main image field
  if (product.image) {
    return getImageUrl(product.image)
  }
  
  // Then try the first image from the images array
  if (product.images && product.images.length > 0) {
    return getImageUrl(product.images[0])
  }
  
  // Return fallback image if no images are available
  return getFallbackImageUrl()
}

/**
 * Gets the fallback image URL for when product images fail to load
 * @returns Fallback image URL
 */
export const getFallbackImageUrl = (): string => {
  return '/assets/img/no-product.png'
}

/**
 * Handles image load error by setting a fallback image
 * @param event - The error event from the img element
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const target = event.target as HTMLImageElement
  target.src = getFallbackImageUrl()
}