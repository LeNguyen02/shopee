import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import adminApi from 'src/apis/admin.api'

type UserRow = {
  id: number
  email: string
  name: string
  phone: string | null
  roles: 'User' | 'Admin'
  created_at: string
  updated_at: string
}

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers()
  })

  const users: UserRow[] = (data?.data.data || []).map((u: any) => ({
    ...u,
    // ensure strict typing if backend includes verify
    // verify: u.verify,
  }))

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return users.filter((u) => {
      const matchesTerm = !term ||
        u.email.toLowerCase().includes(term) ||
        (u.name || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term)
      const matchesRole = !roleFilter || u.roles === roleFilter
      return matchesTerm && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: 'User' | 'Admin' }) => adminApi.updateUserRole(id, roles),
    onSuccess: () => {
      toast.success('Cập nhật quyền thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      toast.error('Cập nhật quyền thất bại')
    }
  })

  const handleChangeRole = (id: number, nextRole: 'User' | 'Admin') => {
    updateRoleMutation.mutate({ id, roles: nextRole })
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN')
    } catch {
      return dateString
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
        <div className="text-sm text-gray-500">Tổng cộng: {filtered.length} người dùng</div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email hoặc số điện thoại"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quyền</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tạo người dùng
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quyền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="inline-flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.roles === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.roles}
                        </span>
                        <select
                          value={u.roles}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as 'User' | 'Admin')}
                          disabled={updateRoleMutation.isPending}
                          className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <UserActions id={u.id} current={{ name: u.name, phone: u.phone || '' }} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateUserModal onClose={() => setIsCreateOpen(false)} />)
      }
    </div>
  )
}

function UserActions({ id, current }: { id: number; current: { name: string; phone: string } }) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(current.name || '')
  const [phone, setPhone] = useState(current.phone || '')

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateUser(id, { name, phone }),
    onSuccess: () => {
      toast.success('Cập nhật người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsOpen(false)
    },
    onError: () => toast.error('Cập nhật người dùng thất bại')
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Xóa người dùng thất bại')
  })

  return (
    <div className="flex items-center gap-3">
      <button className="text-blue-600 hover:text-blue-900" onClick={() => setIsOpen(true)}>Sửa</button>
      <button
        className="text-red-600 hover:text-red-900"
        onClick={() => {
          if (confirm('Bạn có chắc muốn xóa tài khoản này?')) {
            deleteMutation.mutate()
          }
        }}
      >
        Xóa
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Cập nhật thông tin người dùng</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'User' | 'Admin'>('User')

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, password, roles: role }),
    onSuccess: () => {
      toast.success('Tạo người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: () => toast.error('Tạo người dùng thất bại')
  })

  const canSubmit = email.trim() && password.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Tạo người dùng</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quyền</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'User' | 'Admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  )
}


