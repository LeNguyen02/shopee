import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CategoryManagement from './CategoryManagement'
import ProductManagement from './ProductManagement'
import OrdersManagement from './OrdersManagement'
import adminApi from 'src/apis/admin.api'
import FlashSaleManagement from './FlashSaleManagement'
import BannerManagement from './BannerManagement'
import UsersManagement from './UsersManagement'
import SettingsManagement from './SettingsManagement'

interface AdminUser {
  id: number
  email: string
  name: string
  roles: string
}

interface DashboardStats {
  totalUsers: number
  adminUsers: number
  regularUsers: number
  totalProducts: number
  totalCategories: number
  totalOrders: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

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

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const res = await adminApi.getDashboard()
        setStats(res.data.data.stats)
      } catch (error) {
        console.error(error)
        toast.error('Không thể tải số liệu dashboard')
      } finally {
        setLoadingStats(false)
      }
    }

    if (adminUser) fetchStats()
  }, [adminUser])

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
    { id: 'flashsales', label: 'Flash Sales', icon: 'fas fa-bolt' },
    { id: 'banners', label: 'Banners', icon: 'fas fa-images' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ]

  const StatCard = ({ iconClass, label, value, colorClass }: { iconClass: string; label: string; value: number | string; colorClass: string }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-3 ${colorClass} rounded-full`}>
          <i className={`${iconClass}`}></i>
        </div>
        <div className="ml-4">
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard iconClass="fas fa-users text-blue-500" label="Total Users" value={stats?.totalUsers ?? (loadingStats ? '...' : 0)} colorClass="bg-blue-100" />
              <StatCard iconClass="fas fa-user-shield text-indigo-500" label="Admin Users" value={stats?.adminUsers ?? (loadingStats ? '...' : 0)} colorClass="bg-indigo-100" />
              <StatCard iconClass="fas fa-user text-sky-500" label="Regular Users" value={stats?.regularUsers ?? (loadingStats ? '...' : 0)} colorClass="bg-sky-100" />
              <StatCard iconClass="fas fa-box text-green-500" label="Total Products" value={stats?.totalProducts ?? (loadingStats ? '...' : 0)} colorClass="bg-green-100" />
              <StatCard iconClass="fas fa-tags text-purple-500" label="Total Categories" value={stats?.totalCategories ?? (loadingStats ? '...' : 0)} colorClass="bg-purple-100" />
              <StatCard iconClass="fas fa-shopping-cart text-orange-500" label="Total Orders" value={stats?.totalOrders ?? (loadingStats ? '...' : 0)} colorClass="bg-orange-100" />
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
      case 'banners':
        return <BannerManagement />
      case 'settings':
        return <SettingsManagement />
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
