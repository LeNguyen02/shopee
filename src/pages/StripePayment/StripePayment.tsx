import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import paymentApi from 'src/apis/payment.api'
import Button from 'src/components/Button'
import { Order, StripePaymentIntent } from 'src/types/payment.type'
import path from 'src/constants/path'
import { useTranslation } from 'react-i18next'

interface StripePaymentPageState {
  order: Order
  paymentIntent: StripePaymentIntent
}

// Payment form component that uses Stripe Elements
function PaymentForm({ order, paymentIntent }: { order: Order; paymentIntent: StripePaymentIntent }) {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const { t } = useTranslation('payment')

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ orderId, paymentIntentId }: { orderId: string; paymentIntentId: string }) =>
      paymentApi.confirmStripePayment(orderId, paymentIntentId),
    onSuccess: (response) => {
      const order = response.data.data.order
      toast.success(t('stripe.success'))
      navigate(path.orderSuccess, { state: { order } })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('stripe.errors.payment_failed'))
      setIsProcessing(false)
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      toast.error(t('stripe.errors.not_found_card'))
      setIsProcessing(false)
      return
    }

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (error) {
        toast.error(error.message || t('stripe.errors.payment_failed'))
        setIsProcessing(false)
      } else if (confirmedPaymentIntent && confirmedPaymentIntent.status === 'succeeded') {
        // Payment succeeded, confirm with our backend
        confirmPaymentMutation.mutate({
          orderId: order.id,
          paymentIntentId: confirmedPaymentIntent.id
        })
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(t('stripe.errors.generic'))
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-3xl font-semibold mb-4">{t('stripe.payment_info')}</h3>
        
        <div className="mb-4">
          <label className="block text-2xl font-medium text-gray-700 mb-2">
            {t('stripe.card_info')}
          </label>
          <div className="border border-gray-300 rounded-lg p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '20px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-2xl text-gray-600">{t('stripe.total')}</span>
            <span className="text-4xl font-bold text-orange">
              ₫{order.total_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          className="text-2xl px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          onClick={() => navigate(-1)}
        >
          {t('stripe.back')}
        </Button>
        <Button
          type="submit"
          className="text-2xl px-8 py-3 bg-orange text-white rounded-lg hover:bg-orange/90 disabled:opacity-50"
          disabled={!stripe || isProcessing || confirmPaymentMutation.isPending}
        >
          {isProcessing || confirmPaymentMutation.isPending 
            ? t('stripe.processing')
            : t('stripe.pay')
          }
        </Button>
      </div>
    </form>
  )
}

export default function StripePayment() {
  const location = useLocation()
  const state = location.state as StripePaymentPageState
  const { t } = useTranslation('payment')

  if (!state?.order || !state?.paymentIntent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('stripe.not_found_title')}</h2>
          <p className="text-gray-600">{t('stripe.not_found_desc')}</p>
        </div>
      </div>
    )
  }

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">{t('stripe.title')}</h1>
            <p className="text-2xl text-gray-600">{t('stripe.subtitle')}</p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm order={state.order} paymentIntent={state.paymentIntent} />
          </Elements>
        </div>
      </div>
    </div>
  )
}