import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import adminApi from 'src/apis/admin.api'
import { Order, OrderStatus, PaymentStatus, OrderTransaction } from 'src/types/order.type'
import { getImageUrl, handleImageError } from 'src/utils/imageUtils'

interface OrderDetailModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order.order_status)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const queryClient = useQueryClient()

  // Fetch detailed order data with transactions
  const { data: orderDetailData, isLoading } = useQuery({
    queryKey: ['admin-order-detail', order.id],
    queryFn: () => adminApi.getOrder(order.id.toString()),
    enabled: isOpen
  })

  const orderDetail = orderDetailData?.data.data.order
  const transactions = orderDetailData?.data.data.transactions || []

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { order_status?: OrderStatus; payment_status?: PaymentStatus; notes?: string }) =>
      adminApi.updateOrderStatus(order.id.toString(), data),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', order.id] })
      setIsUpdating(false)
    },
    onError: () => {
      toast.error('Cập nhật trạng thái thất bại')
      setIsUpdating(false)
    }
  })

  useEffect(() => {
    if (orderDetail) {
      setOrderStatus(orderDetail.order_status)
      setPaymentStatus(orderDetail.payment_status)
    }
  }, [orderDetail])

  const handleUpdateStatus = async () => {
    if (orderStatus === order.order_status && paymentStatus === order.payment_status) {
      toast.warning('Không có thay đổi nào để cập nhật')
      return
    }

    setIsUpdating(true)
    updateOrderStatusMutation.mutate({
      order_status: orderStatus !== order.order_status ? orderStatus : undefined,
      payment_status: paymentStatus !== order.payment_status ? paymentStatus : undefined,
      notes: notes.trim() || undefined
    })
  }

  const getStatusBadgeClass = (status: string, type: 'order' | 'payment') => {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium'
    
    if (type === 'order') {
      switch (status) {
        case 'pending':
          return `${baseClass} bg-yellow-100 text-yellow-800`
        case 'confirmed':
          return `${baseClass} bg-blue-100 text-blue-800`
        case 'shipping':
          return `${baseClass} bg-purple-100 text-purple-800`
        case 'delivered':
          return `${baseClass} bg-green-100 text-green-800`
        case 'cancelled':
          return `${baseClass} bg-red-100 text-red-800`
        default:
          return `${baseClass} bg-gray-100 text-gray-800`
      }
    } else {
      switch (status) {
        case 'pending':
          return `${baseClass} bg-yellow-100 text-yellow-800`
        case 'paid':
          return `${baseClass} bg-green-100 text-green-800`
        case 'failed':
          return `${baseClass} bg-red-100 text-red-800`
        default:
          return `${baseClass} bg-gray-100 text-gray-800`
      }
    }
  }

  const getStatusText = (status: string, type: 'order' | 'payment') => {
    if (type === 'order') {
      switch (status) {
        case 'pending':
          return 'Chờ xử lý'
        case 'confirmed':
          return 'Đã xác nhận'
        case 'shipping':
          return 'Đang giao'
        case 'delivered':
          return 'Đã giao'
        case 'cancelled':
          return 'Đã hủy'
        default:
          return status
      }
    } else {
      switch (status) {
        case 'pending':
          return 'Chờ thanh toán'
        case 'paid':
          return 'Đã thanh toán'
        case 'failed':
          return 'Thanh toán thất bại'
        default:
          return status
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'order_status_change':
        return 'Thay đổi trạng thái đơn hàng'
      case 'payment_status_change':
        return 'Thay đổi trạng thái thanh toán'
      default:
        return type
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết đơn hàng #{order.id}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Đang tải...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Tên:</span> {orderDetail?.user?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {orderDetail?.user?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Số điện thoại:</span> {orderDetail?.user?.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin đơn hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Tổng tiền:</span> {formatCurrency(orderDetail?.total_amount || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Phương thức thanh toán:</span> 
                      <span className="ml-1">
                        {orderDetail?.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Ngày tạo:</span> {formatDate(orderDetail?.created_at || '')}
                    </div>
                    <div>
                      <span className="font-medium">Cập nhật lần cuối:</span> {formatDate(orderDetail?.updated_at || '')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Địa chỉ giao hàng</h4>
                <div className="text-sm">
                  <div><span className="font-medium">Tên người nhận:</span> {orderDetail?.delivery_address?.fullName}</div>
                  <div><span className="font-medium">Số điện thoại:</span> {orderDetail?.delivery_address?.phone}</div>
                  <div><span className="font-medium">Địa chỉ:</span> {orderDetail?.delivery_address?.address}</div>
                  {orderDetail?.message && (
                    <div className="mt-2">
                      <span className="font-medium">Ghi chú:</span> {orderDetail.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Sản phẩm trong đơn hàng</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderDetail?.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <img
                                src={getImageUrl(item.product_image)}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded mr-3"
                                onError={handleImageError}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">ID: {item.product_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(item.price)}
                            {item.price_before_discount && item.price_before_discount > item.price && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatCurrency(item.price_before_discount)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Cập nhật trạng thái</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái đơn hàng
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipping">Đang giao</option>
                      <option value="delivered">Đã giao</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái thanh toán
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="failed">Thanh toán thất bại</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ghi chú về thay đổi trạng thái..."
                  />
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </button>
                </div>
              </div>

              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Lịch sử thay đổi</h4>
                  <div className="space-y-3">
                    {transactions.map((transaction: OrderTransaction) => (
                      <div key={transaction.id} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getTransactionTypeText(transaction.transaction_type)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.old_status && (
                                <span className="mr-2">
                                  Từ: <span className={getStatusBadgeClass(transaction.old_status, 
                                    transaction.transaction_type === 'order_status_change' ? 'order' : 'payment'
                                  )}>
                                    {getStatusText(transaction.old_status, 
                                      transaction.transaction_type === 'order_status_change' ? 'order' : 'payment'
                                    )}
                                  </span>
                                </span>
                              )}
                              <span>
                                Thành: <span className={getStatusBadgeClass(transaction.new_status, 
                                  transaction.transaction_type === 'order_status_change' ? 'order' : 'payment'
                                )}>
                                  {getStatusText(transaction.new_status, 
                                    transaction.transaction_type === 'order_status_change' ? 'order' : 'payment'
                                  )}
                                </span>
                              </span>
                            </div>
                            {transaction.notes && (
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Ghi chú:</span> {transaction.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{formatDate(transaction.created_at)}</div>
                            {transaction.admin && (
                              <div className="text-xs">Bởi: {transaction.admin.name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
