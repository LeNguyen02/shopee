import { Product, ProductList, ProductListConfig } from 'src/types/product.type'
import { SuccessResponse } from 'src/types/utils.type'
import http from 'src/utils/http'
import { FlashSale } from 'src/types/product.type'

const URL = 'products'
const productApi = {
  getProducts(params: ProductListConfig) {
    return http.get<SuccessResponse<ProductList>>(URL, {
      params
    })
  },
  getProductDetail(id: string) {
    return http.get<SuccessResponse<Product>>(`${URL}/${id}`)
  },
  createProduct(body: {
    name: string
    description?: string
    category_id?: number
    image?: string
    images?: string[]
    price: number
    price_before_discount?: number
    quantity?: number
  }) {
    return http.post<SuccessResponse<Product>>(URL, body)
  },
  checkAvailability(id: string, quantity: number = 1) {
    return http.get<SuccessResponse<{
      available: boolean
      availableQuantity: number
      requestedQuantity: number
      productName: string
    }>>(`${URL}/${id}/availability?quantity=${quantity}`)
  },
  getActiveFlashSale() {
    return http.get<{ message: string; data: FlashSale | null }>('products/flash-sale/active')
  }
}

export default productApi
