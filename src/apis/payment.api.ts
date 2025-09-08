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

  // Cancel order
  cancelOrder(orderId: string) {
    return http.put<SuccessResponse<OrderResponse>>(`${URL}/${orderId}/cancel`)
  }
}

export default paymentApi
