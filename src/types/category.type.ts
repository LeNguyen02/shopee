export interface Category {
  id: number
  name: string
  image?: string
  product_count?: number
  created_at?: string
  updated_at?: string
}

export interface CreateCategoryRequest {
  name: string
  image?: string
}

export interface UpdateCategoryRequest {
  name: string
  image?: string
}
