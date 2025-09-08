import { SuccessResponse } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = 'cart'

export interface CartItem {
  id: number
  quantity: number
  created_at: string
  updated_at: string
  product_id: number
  product_name: string
  product_image: string
  price: number
  price_before_discount: number
  product_quantity: number
}

export interface Cart {
  id: number
  user_id: number
  created_at: string
  updated_at: string
}

export interface CartResponse {
  cart: Cart
  items: CartItem[]
}

export interface AddToCartRequest {
  product_id: string
  quantity?: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CartCountResponse {
  count: number
}

const cartApi = {
  // Get user's cart with items
  getCart() {
    return http.get<SuccessResponse<CartResponse>>(URL)
  },

  // Add item to cart
  addToCart(body: AddToCartRequest) {
    return http.post<SuccessResponse<{ cart_item_id: number; quantity: number }>>(`${URL}/add`, body)
  },

  // Update cart item quantity
  updateCartItem(itemId: string, body: UpdateCartItemRequest) {
    return http.put<SuccessResponse<{ cart_item_id: string; quantity: number }>>(`${URL}/items/${itemId}`, body)
  },

  // Remove item from cart
  removeCartItem(itemId: string) {
    return http.delete<SuccessResponse<null>>(`${URL}/items/${itemId}`)
  },

  // Clear entire cart
  clearCart() {
    return http.delete<SuccessResponse<null>>(`${URL}/clear`)
  },

  // Get cart count (for header badge)
  getCartCount() {
    return http.get<SuccessResponse<CartCountResponse>>(`${URL}/count`)
  }
}

export default cartApi
