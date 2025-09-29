import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { Order } from 'src/types/payment.type'
import Button from 'src/components/Button'
import { formatCurrency } from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'
import path from 'src/constants/path'

interface OrderSuccessPageState {
  order: Order
}

export default function OrderSuccess() {
  const { t } = useTranslation('payment')
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as OrderSuccessPageState

  if (!state?.order) {
    return (
      <div className='bg-neutral-100 py-16'>
        <div className='container'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-800 mb-4'>{t('order_success.not_found')}</h1>
            <Button
              className='bg-orange text-white px-6 py-3 rounded'
              onClick={() => navigate(path.home)}
            >
              {t('order_success.go_home')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { order } = state

  return (
    <div className='bg-neutral-100 py-16'>
      <div className='container max-w-4xl'>
        <div className='bg-white rounded-lg shadow p-8'>
          {/* Success Header */}
          <div className='text-center mb-8'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h1 className='text-4xl font-bold text-green-600 mb-2'>{t('order_success.title')}</h1>
            <p className='text-lg text-gray-600'>{t('order_success.thanks')}</p>
          </div>

          {/* Order Information */}
          <div className='bg-gray-50 rounded-lg p-6 mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>{t('order_success.order_info')}</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='text-lg font-medium text-gray-700 mb-2'>{t('order_success.order_id')}</h3>
                <p className='text-xl font-semibold text-orange'>{order.id}</p>
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-700 mb-2'>{t('order_success.order_date')}</h3>
                <p className='text-lg'>{new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-700 mb-2'>{t('order_success.payment_method')}</h3>
                <p className='text-lg capitalize'>
                  {order.payment_method === 'cod'
                    ? t('order_success.cod')
                    : order.payment_method === 'momo'
                      ? t('order_success.momo')
                      : t('order_success.stripe')}
                </p>
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-700 mb-2'>{t('order_success.payment_status')}</h3>
                <span className={`px-3 py-1 rounded-full text-base font-medium ${
                  order.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : order.payment_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.payment_status === 'paid' ? t('order_success.paid') : 
                   order.payment_status === 'pending' ? t('order_success.pending') : t('order_success.failed')}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className='bg-gray-50 rounded-lg p-6 mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>{t('order_success.delivery_address')}</h2>
            <div className='text-lg text-gray-700'>
              <p className='text-lg font-medium'>{order.delivery_address.fullName}</p>
              <p className='text-lg'>{order.delivery_address.phone}</p>
              <p className='text-lg'>
                {order.delivery_address.address}, {order.delivery_address.ward}, {order.delivery_address.district}, {order.delivery_address.city}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className='mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>{t('order_success.ordered_products')}</h2>
            <div className='space-y-4'>
              {order.items.map((item, index) => (
                <div key={index} className='flex items-center space-x-4 p-4 border border-gray-200 rounded-lg'>
                  <img
                    src={getImageUrl(item.product_image)}
                    alt={item.product_name}
                    className='w-20 h-20 object-cover rounded'
                  />
                  <div className='flex-1'>
                    <h3 className='font-medium text-xl'>{item.product_name}</h3>
                    <p className='text-lg text-gray-600'>Số lượng: {item.quantity}</p>
                    <div className='flex items-center space-x-2 mt-1'>
                      {item.price_before_discount > item.price && (
                        <span className='text-gray-500 line-through text-base'>
                          ₫{formatCurrency(item.price_before_discount)}
                        </span>
                      )}
                      <span className='text-lg text-orange font-semibold'>
                        ₫{formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-xl'>
                      ₫{formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Message */}
          {order.message && (
            <div className='bg-gray-50 rounded-lg p-6 mb-8'>
              <h2 className='text-2xl font-semibold mb-4'>{t('order_success.order_note')}</h2>
              <p className='text-lg text-gray-700'>{order.message}</p>
            </div>
          )}

          {/* Total Amount */}
          <div className='bg-orange-50 rounded-lg p-6 mb-8'>
            <div className='flex justify-between items-center'>
              <span className='text-2xl font-semibold'>{t('order_success.total')}</span>
              <span className='text-3xl font-bold text-orange'>₫{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              className='px-8 py-3 bg-orange text-white rounded-lg hover:bg-orange/90'
              onClick={() => navigate(path.orderHistory)}
            >
              {t('order_success.view_order_history')}
            </Button>
            <Button
              className='px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50'
              onClick={() => navigate(path.home)}
            >
              {t('order_success.continue_shopping')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
