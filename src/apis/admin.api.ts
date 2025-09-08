import { Product, ProductList, CreateProductRequest, UpdateProductRequest } from 'src/types/product.type'
import { Order, OrderList, UpdateOrderStatusRequest } from 'src/types/order.type'
import { SuccessResponse } from 'src/types/utils.type'
import httpAdmin from 'src/utils/httpAdmin'

const URL = 'admin'

const adminApi = {
  // Dashboard
  getDashboard() {
    return httpAdmin.get<SuccessResponse<{ stats: {
      totalUsers: number
      adminUsers: number
      regularUsers: number
      totalProducts: number
      totalCategories: number
      totalOrders: number
    } }>>(`${URL}/dashboard`)
  },

  // Products
  getProducts(params: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) {
    return httpAdmin.get<SuccessResponse<ProductList>>(`${URL}/products`, {
      params
    })
  },

  getProduct(id: string) {
    return httpAdmin.get<SuccessResponse<Product>>(`${URL}/products/${id}`)
  },

  createProduct(body: CreateProductRequest) {
    return httpAdmin.post<SuccessResponse<Product>>(`${URL}/products`, body)
  },

  updateProduct(id: string, body: UpdateProductRequest) {
    return httpAdmin.put<SuccessResponse<Product>>(`${URL}/products/${id}`, body)
  },

  deleteProduct(id: string) {
    return httpAdmin.delete<SuccessResponse<null>>(`${URL}/products/${id}`)
  },

  // Orders
  getOrders(params: {
    page?: number
    limit?: number
    status?: string
    payment_status?: string
    search?: string
  }) {
    return httpAdmin.get<SuccessResponse<OrderList>>(`${URL}/orders`, {
      params
    })
  },

  getOrder(id: string) {
    return httpAdmin.get<SuccessResponse<{ order: Order; transactions: any[] }>>(`${URL}/orders/${id}`)
  },

  updateOrderStatus(id: string, body: UpdateOrderStatusRequest) {
    return httpAdmin.put<SuccessResponse<Order>>(`${URL}/orders/${id}/status`, body)
  },

  // Image upload
  uploadImage(file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return httpAdmin.post<SuccessResponse<{
      filename: string
      originalName: string
      size: number
      url: string
    }>>(`${URL}/upload/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    return httpAdmin.post<SuccessResponse<Array<{
      filename: string
      originalName: string
      size: number
      url: string
    }>>>(`${URL}/upload/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Category image upload
  uploadCategoryImage(file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return httpAdmin.post<SuccessResponse<{
      filename: string
      originalName: string
      size: number
      url: string
    }>>(`${URL}/upload/category-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default adminApi
