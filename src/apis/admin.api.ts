import { Product, ProductList, CreateProductRequest, UpdateProductRequest } from 'src/types/product.type'
import { Order, OrderList, UpdateOrderStatusRequest } from 'src/types/order.type'
import { SuccessResponse } from 'src/types/utils.type'
import httpAdmin from 'src/utils/httpAdmin'
import { FlashSale } from 'src/types/product.type'

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
  getUsers() {
    return httpAdmin.get<SuccessResponse<Array<{ id: number; email: string; name: string; phone: string | null; roles: 'User' | 'Admin'; verify: number; created_at: string; updated_at: string }>>>(
      `${URL}/users`
    )
  },

  updateUserRole(id: number, roles: 'User' | 'Admin') {
    return httpAdmin.put<SuccessResponse<null>>(`${URL}/users/${id}/role`, { roles })
  },

  updateUser(id: number, body: Partial<{ name: string; phone: string; address: string; date_of_birth: string }>) {
    return httpAdmin.put<SuccessResponse<null>>(`${URL}/users/${id}`, body)
  },

  deleteUser(id: number) {
    return httpAdmin.delete<SuccessResponse<null>>(`${URL}/users/${id}`)
  },

  createUser(body: { name: string; email: string; password: string; roles: 'User' | 'Admin' }) {
    return httpAdmin.post<SuccessResponse<{ id: number }>>(`${URL}/users`, body)
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
    user_payment_confirmed?: 0 | 1 | ''
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

  // MoMo settings
  getMomoSettings() {
    return httpAdmin.get<SuccessResponse<{ settings: { name: string; account_number: string; qr_image_url: string; instructions: string } }>>(
      `${URL}/settings/momo`
    )
  },
  updateMomoSettings(settings: { name: string; account_number: string; qr_image_url: string; instructions: string }) {
    return httpAdmin.put<SuccessResponse<{ settings: { name: string; account_number: string; qr_image_url: string; instructions: string } }>>(
      `${URL}/settings/momo`,
      settings
    )
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
  },

   // Flash Sales
   createFlashSale(body: { name: string; start_time: string; end_time: string; is_active?: 0 | 1 }) {
    return httpAdmin.post<SuccessResponse<FlashSale>>(`${URL}/flash-sales`, body)
  },

  updateFlashSale(id: number, body: Partial<{ name: string; start_time: string; end_time: string; is_active: 0 | 1 }>) {
    return httpAdmin.put<SuccessResponse<FlashSale>>(`${URL}/flash-sales/${id}`, body)
  },

  addFlashSaleItems(id: number, items: Array<{ product_id: number; sale_price: number; item_limit?: number | null }>) {
    return httpAdmin.post<SuccessResponse<FlashSale>>(`${URL}/flash-sales/${id}/items`, { items })
  },

  deleteFlashSaleItem(id: number, productId: number) {
    return httpAdmin.delete<SuccessResponse<FlashSale>>(`${URL}/flash-sales/${id}/items/${productId}`)
  },

  getFlashSales(params: { page?: number; limit?: number; search?: string; status?: string }) {
    return httpAdmin.get<SuccessResponse<{ flash_sales: FlashSale[]; pagination: { page: number; limit: number; total: number; page_size: number } }>>(
      `${URL}/flash-sales`,
      { params }
    )
  },

  getFlashSaleDetail(id: number) {
    return httpAdmin.get<SuccessResponse<FlashSale>>(`${URL}/flash-sales/${id}`)
  }
}

export default adminApi
