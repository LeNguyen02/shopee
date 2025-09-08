import 'react-toastify/dist/ReactToastify.css'
import './assets/css/base.css'
import './assets/css/grid.css'
import './assets/css/main.css'
import './assets/css/responsive.css'

import {
  useContext,
  useEffect
} from 'react'

import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import ErrorBoundary from './components/ErrorBoundary'
import { AppContext } from './contexts/app.context'
import useRouteElements from './useRouteElements'
import { LocalStorageEventTarget } from './utils/auth'

function App() {
  const routeElements = useRouteElements()
  const { reset } = useContext(AppContext)
  useEffect(() => {
    LocalStorageEventTarget.addEventListener('clearLS', reset)
    return () => {
      LocalStorageEventTarget.removeEventListener('clearLS', reset)
    }
  }, [reset])

  return (
    <HelmetProvider>
      <ErrorBoundary>
        {routeElements}
        <ToastContainer />
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </HelmetProvider>
  )
}

export default App
