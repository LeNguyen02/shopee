export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  district: string
  ward: string
}

export interface PaymentMethod {
  type: 'cod' | 'stripe' | 'momo'
  name: string
  description: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  product_image: string
  price: number
  price_before_discount: number
  quantity: number
}

export interface CreateOrderRequest {
  items: OrderItem[]
  delivery_address: DeliveryAddress
  message?: string
  payment_method: 'cod' | 'stripe' | 'momo'
  total_amount: number
}

export interface Order {
  id: string
  user_id: number
  items: OrderItem[]
  delivery_address: DeliveryAddress
  message?: string
  payment_method: 'cod' | 'stripe' | 'momo'
  payment_status: 'pending' | 'paid' | 'failed'
  order_status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
  momo_transfer_note?: string | null
  user_payment_confirmed?: 0 | 1
  user_payment_confirmed_at?: string | null
}

export interface StripePaymentIntent {
  client_secret: string
  payment_intent_id: string
}

export interface MomoSettings {
  name: string
  account_number: string
  qr_image_url: string
  instructions: string
}

export interface OrderResponse {
  order: Order
  stripe_payment_intent?: StripePaymentIntent
}
