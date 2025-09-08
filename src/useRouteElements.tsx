import {
  lazy,
  Suspense,
  useContext
} from 'react'

import {
  Navigate,
  Outlet,
  useRoutes
} from 'react-router-dom'
import path from 'src/constants/path'

import { AppContext } from './contexts/app.context'
// import Login from './pages/Login'
// import ProductList from './pages/ProductList'
// import Profile from './pages/User/pages/Profile'
// import Register from './pages/Register'
// import ProductDetail from './pages/ProductDetail'
// import Cart from './pages/Cart'
import CartLayout from './layouts/CartLayout'
import MainLayout from './layouts/MainLayout'
import RegisterLayout from './layouts/RegisterLayout'
import Home from './pages/Home/Home'
import UserLayout from './pages/User/layouts/UserLayout'

// import ChangePassword from './pages/User/pages/ChangePassword'
// import HistoryPurchase from './pages/User/pages/HistoryPurchase'
// import OrderHistory from './pages/User/pages/OrderHistory'
// import NotFound from './pages/NotFound'

const Login = lazy(() => import('./pages/Login'))
const ProductList = lazy(() => import('./pages/ProductList'))
const Search = lazy(() => import('./pages/Search'))
const Profile = lazy(() => import('./pages/User/pages/Profile'))
const Register = lazy(() => import('./pages/Register'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const ChangePassword = lazy(() => import('./pages/User/pages/ChangePassword'))
const HistoryPurchase = lazy(() => import('./pages/User/pages/HistoryPurchase'))
const OrderHistory = lazy(() => import('./pages/User/pages/OrderHistory'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Payment = lazy(() => import('./pages/Payment'))
const StripePayment = lazy(() => import('./pages/StripePayment'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))

/**
 * Để tối ưu re-render thì nên ưu tiên dùng <Outlet /> thay cho {children}
 * Lưu ý là <Outlet /> nên đặt ngay trong component `element` thì mới có tác dụng tối ưu
 * Chứ không phải đặt bên trong children của component `element`
 */

//  ✅ Tối ưu re-render
// export default memo(function RegisterLayout({ children }: Props) {
//  return (
//    <div>
//      <RegisterHeader />
//      {children}
//      <Outlet />
//      <Footer />
//    </div>
//  )
//  })

//  ❌ Không tối ưu được vì <Outlet /> đặt vào vị trí children
// Khi <Outlet /> thay đổi tức là children thay đổi
// Dẫn đến component `RegisterLayout` bị re-render dù cho có dùng React.memo như trên
// <RegisterLayout>
//   <Outlet />
// </RegisterLayout>

function ProtectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return isAuthenticated ? <Outlet /> : <Navigate to='/login' />
}

function RejectedRoute() {
  const { isAuthenticated } = useContext(AppContext)

  return !isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

export default function useRouteElements() {
  const routeElements = useRoutes([
    {
      path: '',
      element: <RejectedRoute />,
      children: [
        {
          path: '',
          element: <RegisterLayout />,
          children: [
            {
              path: path.login,
              element: (
                <Suspense>
                  <Login />
                </Suspense>
              )
            },
            {
              path: path.register,
              element: (
                <Suspense>
                  <Register />
                </Suspense>
              )
            }
          ]
        }
      ]
    },
    {
      path: '',
      element: <ProtectedRoute />,
      children: [
        {
          path: path.cart,
          element: (
            <CartLayout>
              <Suspense>
                <Cart />
              </Suspense>
            </CartLayout>
          )
        },
        {
          path: path.payment,
          element: (
            <CartLayout>
              <Suspense>
                <Payment />
              </Suspense>
            </CartLayout>
          )
        },
        {
          path: path.stripePayment,
          element: (
            <CartLayout>
              <Suspense>
                <StripePayment />
              </Suspense>
            </CartLayout>
          )
        },
        {
          path: path.orderSuccess,
          element: (
            <CartLayout>
              <Suspense>
                <OrderSuccess />
              </Suspense>
            </CartLayout>
          )
        },
        {
          path: path.user,
          element: <MainLayout />,
          children: [
            {
              path: '',
              element: <UserLayout />,
              children: [
                {
                  path: 'profile',
                  element: (
                    <Suspense>
                      <Profile />
                    </Suspense>
                  )
                },
                {
                  path: 'password',
                  element: (
                    <Suspense>
                      <ChangePassword />
                    </Suspense>
                  )
                },
                {
                  path: 'purchase',
                  element: (
                    <Suspense>
                      <HistoryPurchase />
                    </Suspense>
                  )
                },
                {
                  path: 'orders',
                  element: (
                    <Suspense>
                      <OrderHistory />
                    </Suspense>
                  )
                }
              ]
            }
          ]
        }
      ]
    },
    {
      path: '',
      element: <MainLayout />,
      children: [
        {
          path: `${path.productDetail}/:id`,
          element: (
            <Suspense>
              <ProductDetail />
            </Suspense>
          )
        },
        {
          path: path.search,
          element: (
            <Suspense>
              <Search />
            </Suspense>
          )
        },
        {
          path: '',
          index: true,
          element: (
            <Suspense>
              <Home />
            </Suspense>
          )
        },
        {
          path: '*',
          element: (
            <Suspense>
              <NotFound />
            </Suspense>
          )
        }
      ]
    },
    {
      path: '',
      element: <RegisterLayout />,
      children: [
        {
          path: path.admin,
          element: (
            <Suspense>
              <AdminLogin />
            </Suspense>
          )
        }
      ]
    },
    {
      path: path.adminDashboard,
      element: (
        <Suspense>
          <AdminDashboard />
        </Suspense>
      )
    },
    {
      path: 'home',
      element: (
        <Suspense>
          <Home />
        </Suspense>
      )
    }
  ])
  return routeElements
}
