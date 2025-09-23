import { loadStripe } from '@stripe/stripe-js'

// You should replace this with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here')

export default stripePromise
