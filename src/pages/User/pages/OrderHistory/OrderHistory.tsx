import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import paymentApi from 'src/apis/payment.api'
import Button from 'src/components/Button'
import { formatCurrency } from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'
import { Order } from 'src/types/payment.type'
import path from 'src/constants/path'

// Confirmation Modal Component
function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  isLoading = false 
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-sm text-gray-500 mb-6">
            {message}
          </p>
          
          {/* Actions */}
          <div className="flex space-x-3 justify-center">
            <Button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Order status mapping
const orderStatusMap = {
  pending: { text: 'Đã đặt hàng', color: 'bg-blue-100 text-blue-800' },
  confirmed: { text: 'Đang vận chuyển', color: 'bg-yellow-100 text-yellow-800' },
  shipping: { text: 'Đang vận chuyển', color: 'bg-yellow-100 text-yellow-800' },
  delivered: { text: 'Đã nhận hàng', color: 'bg-green-100 text-green-800' },
  cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800' }
}

// Payment status mapping
const paymentStatusMap = {
  pending: { text: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
  paid: { text: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  failed: { text: 'Thanh toán thất bại', color: 'bg-red-100 text-red-800' },
  refunded: { text: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' }
}

// Order detail modal component
function OrderDetailModal({ 
  order, 
  isOpen, 
  onClose, 
  onCancelOrder 
}: { 
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onCancelOrder: (orderId: string) => void
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!isOpen || !order) return null

  const handleCancelOrder = () => {
    onCancelOrder(order.id)
    setShowCancelConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng #{order.id}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-semibold mb-4">Thông tin đơn hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Mã đơn hàng</h4>
                <p className="text-xl font-semibold text-orange">{order.id}</p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Ngày đặt hàng</h4>
                <p className="text-lg">{new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Phương thức thanh toán</h4>
                <p className="text-lg capitalize">
                  {order.payment_method === 'cod'
                    ? 'Thanh toán khi nhận hàng (COD)'
                    : order.payment_method === 'momo'
                      ? 'Chuyển khoản MoMo'
                      : 'Thanh toán bằng thẻ (Stripe)'}
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Trạng thái đơn hàng</h4>
                <span className={`px-3 py-1 rounded-full text-base font-medium ${orderStatusMap[order.order_status as keyof typeof orderStatusMap]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {orderStatusMap[order.order_status as keyof typeof orderStatusMap]?.text || order.order_status}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Trạng thái thanh toán</h4>
                <span className={`px-3 py-1 rounded-full text-base font-medium ${paymentStatusMap[order.payment_status as keyof typeof paymentStatusMap]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {paymentStatusMap[order.payment_status as keyof typeof paymentStatusMap]?.text || order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-semibold mb-4">Địa chỉ giao hàng</h3>
            <div className="text-lg text-gray-700">
              <p className="text-lg font-medium">{order.delivery_address.fullName}</p>
              <p className="text-lg">{order.delivery_address.phone}</p>
              <p className="text-lg">
                {order.delivery_address.address}, {order.delivery_address.ward}, {order.delivery_address.district}, {order.delivery_address.city}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-4">Sản phẩm đã đặt</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={getImageUrl(item.product_image)}
                    alt={item.product_name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-xl">{item.product_name}</h4>
                    <p className="text-lg text-gray-600">Số lượng: {item.quantity}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {item.price_before_discount > item.price && (
                        <span className="text-gray-500 line-through text-base">
                          ₫{formatCurrency(item.price_before_discount)}
                        </span>
                      )}
                      <span className="text-lg text-orange font-semibold">
                        ₫{formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xl">
                      ₫{formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Message */}
          {order.message && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4">Ghi chú đơn hàng</h3>
              <p className="text-lg text-gray-700">{order.message}</p>
            </div>
          )}

          {/* Total Amount */}
          <div className="bg-orange-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-semibold">Tổng cộng:</span>
              <span className="text-3xl font-bold text-orange">₫{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={onClose}
            >
              Đóng
            </Button>
            {order.order_status === 'pending' && (
              <Button
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                onClick={() => setShowCancelConfirm(true)}
              >
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelOrder}
        title="Xác nhận hủy đơn hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
        confirmText="Hủy đơn hàng"
        cancelText="Không hủy"
      />
    </div>
  )
}

export default function OrderHistory() {
  const navigate = useNavigate()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)

  // Fetch user orders
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => paymentApi.getUserOrders()
  })

  const orders = ordersData?.data.data || []

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => paymentApi.cancelOrder(orderId),
    onSuccess: () => {
      toast.success('Hủy đơn hàng thành công')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng')
    }
  })

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const handleCancelOrderClick = (orderId: string) => {
    setOrderToCancel(orderId)
    setShowCancelConfirm(true)
  }

  const handleCancelOrderConfirm = () => {
    if (orderToCancel) {
      cancelOrderMutation.mutate(orderToCancel)
      setShowCancelConfirm(false)
      setOrderToCancel(null)
    }
  }

  const handleCancelOrderFromModal = (orderId: string) => {
    cancelOrderMutation.mutate(orderId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl text-gray-600">Đang tải...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl text-red-600">Có lỗi xảy ra khi tải đơn hàng</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lịch sử đơn hàng</h1>
          <p className="text-lg text-gray-600">Quản lý và theo dõi các đơn hàng của bạn</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-lg text-gray-600 mb-6">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!</p>
            <Button
              className="px-8 py-3 bg-orange text-white rounded-lg hover:bg-orange/90"
              onClick={() => navigate(path.home)}
            >
              Mua sắm ngay
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((orderData) => {
              const order = orderData.order
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-lg p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">Đơn hàng #{order.id}</h3>
                      <p className="text-lg text-gray-600">
                        Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange">
                        ₫{formatCurrency(order.total_amount)}
                      </div>
                      <p className="text-lg text-gray-600">
                        {order.items.length} sản phẩm
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex space-x-4 overflow-x-auto">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex-shrink-0">
                          <img
                            src={getImageUrl(item.product_image)}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      <span className={`px-3 py-1 rounded-full text-base font-medium ${orderStatusMap[order.order_status as keyof typeof orderStatusMap]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {orderStatusMap[order.order_status as keyof typeof orderStatusMap]?.text || order.order_status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-base font-medium ${paymentStatusMap[order.payment_status as keyof typeof paymentStatusMap]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {paymentStatusMap[order.payment_status as keyof typeof paymentStatusMap]?.text || order.payment_status}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        onClick={() => handleViewOrder(order)}
                      >
                        Xem chi tiết
                      </Button>
                      {order.order_status === 'pending' && (
                        <Button
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                          onClick={() => handleCancelOrderClick(order.id)}
                          disabled={cancelOrderMutation.isPending}
                        >
                          {cancelOrderMutation.isPending ? 'Đang hủy...' : 'Hủy đơn'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Order Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCancelOrder={handleCancelOrderFromModal}
        />

        {/* Confirmation Modal for Main Order List */}
        <ConfirmationModal
          isOpen={showCancelConfirm}
          onClose={() => {
            setShowCancelConfirm(false)
            setOrderToCancel(null)
          }}
          onConfirm={handleCancelOrderConfirm}
          title="Xác nhận hủy đơn hàng"
          message="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
          confirmText="Hủy đơn hàng"
          cancelText="Không hủy"
          isLoading={cancelOrderMutation.isPending}
        />
      </div>
    </div>
  )
}
