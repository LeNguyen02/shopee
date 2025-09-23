import { CreateOrderRequest, OrderResponse } from 'src/types/payment.type'
import { SuccessResponse } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = 'orders'

const paymentApi = {
  // Create new order
  createOrder(body: CreateOrderRequest) {
    return http.post<SuccessResponse<OrderResponse>>(`${URL}`, body)
  },

  // Get order by ID
  getOrder(orderId: string) {
    return http.get<SuccessResponse<OrderResponse>>(`${URL}/${orderId}`)
  },

  // Get user's orders
  getUserOrders() {
    return http.get<SuccessResponse<OrderResponse[]>>(`${URL}/user`)
  },

  // Confirm Stripe payment
  confirmStripePayment(orderId: string, paymentIntentId: string) {
    return http.post<SuccessResponse<OrderResponse>>(`${URL}/${orderId}/confirm-payment`, {
      payment_intent_id: paymentIntentId
    })
  },

  // MoMo: get settings
  getMomoSettings() {
    return http.get<SuccessResponse<{ settings: { name: string; account_number: string; qr_image_url: string; instructions: string } }>>(
      `${URL}/momo-settings`
    )
  },

  // MoMo: user confirm transfer
  confirmMomoTransfer(orderId: string, transfer_note: string) {
    return http.post<SuccessResponse<OrderResponse>>(`${URL}/${orderId}/momo-confirm`, { transfer_note })
  },

  // Cancel order
  cancelOrder(orderId: string) {
    return http.put<SuccessResponse<OrderResponse>>(`${URL}/${orderId}/cancel`)
  }
}

export default paymentApi
