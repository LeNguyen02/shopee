import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CategoryManagement from './CategoryManagement'
import ProductManagement from './ProductManagement'
import OrdersManagement from './OrdersManagement'
import adminApi from 'src/apis/admin.api'

import FlashSaleManagement from './FlashSaleManagement'
import UsersManagement from './UsersManagement'

interface AdminUser {
  id: number
  email: string
  name: string
  roles: string
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeMenu, setActiveMenu] = useState('dashboard')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const user = localStorage.getItem('admin_user')
    
    if (!token || !user) {
      navigate('/admin')
      return
    }
    
    try {
      setAdminUser(JSON.parse(user))
    } catch {
      navigate('/admin')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    toast.success('Đăng xuất thành công')
    navigate('/admin')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' },
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'categories', label: 'Categories', icon: 'fas fa-tags' },
    { id: 'products', label: 'Products', icon: 'fas fa-box' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-shopping-cart' },
    { id: 'flashsales', label: 'Flash Sales', icon: 'fas fa-bolt' }
  ]

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <i className="fas fa-users text-blue-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <i className="fas fa-box text-green-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <i className="fas fa-tags text-purple-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Total Categories</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'users':
        return <UsersManagement />
      case 'categories':
        return <CategoryManagement />
      case 'products':
        return <ProductManagement />
      case 'orders':
        return <OrdersManagement />
      case 'flashsales':
        return <FlashSaleManagement />
      default:
        return null
    }
  }

  if (!adminUser) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Xin chào, {adminUser.name}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen">
          <nav className="mt-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition duration-200 ${
                  activeMenu === item.id 
                    ? 'border-r-2 border-blue-500 bg-gray-50 text-blue-600' 
                    : 'text-gray-700'
                }`}
              >
                <i className={`${item.icon} mr-3`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
