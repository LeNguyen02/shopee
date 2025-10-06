import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import { CartItem } from 'src/apis/cart.api'
import paymentApi from 'src/apis/payment.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import AddressSelect from 'src/components/AddressSelect'
import useAddressSelection from 'src/hooks/useAddressSelection'
import { DeliveryAddress, PaymentMethod, CreateOrderRequest } from 'src/types/payment.type'
import { formatCurrency } from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'
import path from 'src/constants/path'

interface PaymentPageState {
  selectedItems: CartItem[]
  totalAmount: number
}

const paymentMethods: PaymentMethod[] = [
  {
    type: 'cod',
    name: 'payment.cod_name',
    description: 'payment.cod_desc'
  },
  // {
  //   type: 'stripe',
  //   name: 'Thanh toán bằng thẻ (Stripe)',
  //   description: 'Thanh toán an toàn bằng thẻ tín dụng/ghi nợ'
  // },
  {
    type: 'momo',
    name: 'payment.momo_name',
    description: 'payment.momo_desc'
  }
]

export default function Payment() {
  const { t } = useTranslation('payment')
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as PaymentPageState

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: ''
  })

  // Address selection hook
  const {
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces,
    districts,
    wards,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedWard,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards
  } = useAddressSelection()

  const [message, setMessage] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'stripe' | 'momo'>('cod')
  const [errors, setErrors] = useState<Partial<DeliveryAddress>>({})

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateOrderRequest) => paymentApi.createOrder(body),
    onSuccess: (response) => {
      const order = response.data.data.order
      if (selectedPaymentMethod === 'stripe' && response.data.data.stripe_payment_intent) {
        // Redirect to Stripe payment page
        navigate(path.stripePayment, { 
          state: { 
            order, 
            paymentIntent: response.data.data.stripe_payment_intent 
          } 
        })
      } else if (selectedPaymentMethod === 'momo') {
        // Redirect to MoMo payment instruction page
        navigate(path.momoPayment, { state: { order } })
      } else {
        // Redirect to order success page
        navigate(path.orderSuccess, { state: { order } })
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('payment.errors.create_order')
      toast.error(message)
      
      // If it's an inventory issue, redirect to cart
      if (message.includes('không đủ số lượng') || message.includes('hết hàng')) {
        setTimeout(() => {
          navigate(path.cart)
        }, 2000)
      }
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryAddress> = {}
    
    if (!deliveryAddress.fullName.trim()) {
      newErrors.fullName = t('payment.form_errors.fullName')
    }
    if (!deliveryAddress.phone.trim()) {
      newErrors.phone = t('payment.form_errors.phone_required')
    } else if (!/^[0-9]{10,11}$/.test(deliveryAddress.phone)) {
      newErrors.phone = t('payment.form_errors.phone_invalid')
    }
    if (!deliveryAddress.address.trim()) {
      newErrors.address = t('payment.form_errors.address')
    }
    if (!selectedProvince) {
      newErrors.city = t('payment.form_errors.city')
    }
    if (!selectedDistrict) {
      newErrors.district = t('payment.form_errors.district')
    }
    if (!selectedWard) {
      newErrors.ward = t('payment.form_errors.ward')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (!state?.selectedItems || state.selectedItems.length === 0) {
      toast.error(t('payment.form_errors.no_selected_items'))
      return
    }

    const orderItems = state.selectedItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      price: item.price,
      price_before_discount: item.price_before_discount,
      quantity: item.quantity
    }))

    // Get selected address names
    const selectedProvinceName = provinces.find(p => p.code === selectedProvince)?.name || ''
    const selectedDistrictName = districts.find(d => d.code === selectedDistrict)?.name || ''
    const selectedWardName = wards.find(w => w.code === selectedWard)?.name || ''

    const orderData: CreateOrderRequest = {
      items: orderItems,
      delivery_address: {
        ...deliveryAddress,
        city: selectedProvinceName,
        district: selectedDistrictName,
        ward: selectedWardName
      },
      message: message.trim() || undefined,
      payment_method: selectedPaymentMethod,
      total_amount: state.totalAmount
    }

    createOrderMutation.mutate(orderData)
  }

  if (!state?.selectedItems || state.selectedItems.length === 0) {
    return (
      <div className='bg-neutral-100 py-16'>
        <div className='container'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-800 mb-6'>{t('payment.no_items')}</h1>
            <Button
              className='bg-orange text-white px-8 py-4 rounded text-xl'
              onClick={() => navigate(path.cart)}
            >
              {t('payment.back_to_cart')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-neutral-100 py-16'>
      <div className='container'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Delivery Address */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h2 className='text-3xl font-bold mb-6'>{t('payment.shipping_info')}</h2>
              <div className='grid text-xl grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Input
                    name='fullName'
                    placeholder={t('payment.full_name')}
                    value={deliveryAddress.fullName}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                    errorMessage={errors.fullName}
                  />
                </div>
                <div>
                  <Input
                    name='phone'
                    placeholder={t('payment.phone')}
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                    errorMessage={errors.phone}
                  />
                </div>
                <div className='md:col-span-2'>
                  <Input
                    name='address'
                    placeholder={t('payment.address')}
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                    errorMessage={errors.address}
                  />
                </div>
                <div>
                  <AddressSelect
                    name='city'
                    placeholder={t('payment.select_city')}
                    value={selectedProvince}
                    onChange={setSelectedProvince}
                    options={provinces}
                    isLoading={isLoadingProvinces}
                    errorMessage={errors.city}
                  />
                </div>
                <div>
                  <AddressSelect
                    name='district'
                    placeholder={t('payment.select_district')}
                    value={selectedDistrict}
                    onChange={setSelectedDistrict}
                    options={districts}
                    isLoading={isLoadingDistricts}
                    errorMessage={errors.district}
                  />
                </div>
                <div>
                  <AddressSelect
                    name='ward'
                    placeholder={t('payment.select_ward')}
                    value={selectedWard}
                    onChange={setSelectedWard}
                    options={wards}
                    isLoading={isLoadingWards}
                    errorMessage={errors.ward}
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h2 className='text-3xl font-bold mb-6'>{t('payment.order_note')}</h2>
              <textarea
                className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xl'
                rows={4}
                placeholder={t('payment.order_note_placeholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Payment Methods */}
            <div className='bg-white rounded-lg shadow p-6'>
              <h2 className='text-3xl font-bold mb-6'>{t('payment.payment_methods')}</h2>
              <div className='space-y-4'>
                {paymentMethods.map((method) => (
                  <div
                    key={method.type}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.type
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.type)}
                  >
                    <div className='flex items-center'>
                      <input
                        type='radio'
                        name='paymentMethod'
                        value={method.type}
                        checked={selectedPaymentMethod === method.type}
                        onChange={() => setSelectedPaymentMethod(method.type)}
                        className='mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500'
                      />
                      <div>
                        <h3 className='font-semibold text-2xl'>{t(method.name as any)}</h3>
                        <p className='text-gray-600 text-xl'>{t(method.description as any)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow p-6 sticky top-4'>
              <h2 className='text-3xl font-bold mb-6'>{t('payment.order_summary')}</h2>
              <div className='space-y-4'>
                {state.selectedItems.map((item) => (
                  <div key={item.id} className='flex items-center space-x-3'>
                    <img
                      src={getImageUrl(item.product_image)}
                      alt={item.product_name}
                      className='w-20 h-20 object-cover rounded'
                    />
                    <div className='flex-1'>
                      <h3 className='font-medium text-xl line-clamp-2'>{item.product_name}</h3>
                      <p className='text-gray-600 text-lg'>{t('payment.quantity', { count: item.quantity })}</p>
                      <p className='text-orange font-semibold'>
                        ₫{formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className='border-t pt-4 mt-4'>
                <div className='flex justify-between items-center text-2xl font-bold'>
                  <span>{t('payment.grand_total')}</span>
                  <span className='text-orange'>₫{formatCurrency(state.totalAmount)}</span>
                </div>
              </div>
              <Button
                className='w-full mt-6 bg-orange text-white py-4 rounded-lg font-semibold text-2xl hover:bg-orange/90'
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? t('payment.processing') : t('payment.place_order')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
