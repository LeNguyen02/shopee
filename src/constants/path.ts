const path = {
  home: '/',
  search: '/search',
  user: '/user',
  profile: '/user/profile',
  changePassword: '/user/password',
  historyPurchase: '/user/purchase',
  orderHistory: '/user/orders',
  login: '/login',
  register: '/register',
  logout: '/logout',
  productDetail: '/product',
  cart: '/cart',
  payment: '/payment',
  stripePayment: '/stripe-payment',
  momoPayment: '/momo-payment',
  orderSuccess: '/order-success',
  admin: '/admin',
  adminDashboard: '/admin/dashboard',
  adminCategories: '/admin/categories'
} as const

export default path
