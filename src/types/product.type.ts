export interface Product {
  id: number
  _id?: string // For backward compatibility
  images: string[]
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  name: string
  description: string
  category_id?: number
  category_name?: string
  category?: {
    _id: string
    name: string
  }
  image: string
  created_at: string
  updated_at: string
  createdAt?: string // For backward compatibility
  updatedAt?: string // For backward compatibility
}

export interface FlashSaleItem {
  id: number
  flash_sale_id: number
  product_id: number
  sale_price: number
  item_limit?: number | null
  product_name?: string
  product_image?: string
  product_sold?: number
}

export interface FlashSale {
  id: number
  name: string
  start_time: string
  end_time: string
  is_active: 0 | 1
  items: FlashSaleItem[]
}

export interface ProductList {
  products: Product[]
  pagination: {
    page: number
    limit: number
    page_size: number
    total: number
  }
}

export interface ProductListConfig {
  page?: number | string
  limit?: number | string
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
  exclude?: string
  rating_filter?: number | string
  price_max?: number | string
  price_min?: number | string
  name?: string
  category?: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  category_id?: number | null
  image?: string
  images?: string[]
  price: number
  price_before_discount?: number | null
  quantity?: number
}

export interface UpdateProductRequest {
  name: string
  description?: string
  category_id?: number | null
  image?: string
  images?: string[]
  price: number
  price_before_discount?: number | null
  quantity?: number
}
