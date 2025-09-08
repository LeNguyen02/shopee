export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  district: string
  ward: string
}

export interface PaymentMethod {
  type: 'cod' | 'stripe'
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
  payment_method: 'cod' | 'stripe'
  total_amount: number
}

export interface Order {
  id: string
  user_id: number
  items: OrderItem[]
  delivery_address: DeliveryAddress
  message?: string
  payment_method: 'cod' | 'stripe'
  payment_status: 'pending' | 'paid' | 'failed'
  order_status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
}

export interface StripePaymentIntent {
  client_secret: string
  payment_intent_id: string
}

export interface OrderResponse {
  order: Order
  stripe_payment_intent?: StripePaymentIntent
}
