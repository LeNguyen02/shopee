export interface OrderItem {
  product_id: number
  product_name: string
  product_image: string
  price: number
  price_before_discount?: number
  quantity: number
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  province?: string
  district?: string
  ward?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type PaymentMethod = 'cod' | 'stripe' | 'momo'

export interface Order {
  id: number
  user_id: number
  delivery_address: DeliveryAddress
  message?: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
  items: OrderItem[]
  user?: {
    id: number
    name: string
    email: string
    phone?: string
  }
  momo_transfer_note?: string | null
  user_payment_confirmed?: 0 | 1
  user_payment_confirmed_at?: string | null
}

export interface OrderTransaction {
  id: number
  order_id: number
  admin_id?: number
  transaction_type: 'order_status_change' | 'payment_status_change'
  old_status?: string
  new_status: string
  notes?: string
  created_at: string
  admin?: {
    id: number
    name: string
    email: string
  }
}

export interface OrderList {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    page_size: number
  }
}

export interface UpdateOrderStatusRequest {
  order_status?: OrderStatus
  payment_status?: PaymentStatus
  notes?: string
}
