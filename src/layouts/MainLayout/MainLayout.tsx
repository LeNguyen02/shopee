import { memo } from 'react'

import { Outlet } from 'react-router-dom'
import Footer from 'src/components/Footer'
import Header from 'src/components/Header'

function MainLayoutInner() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
const MainLayout = memo(MainLayoutInner)
export default MainLayout
