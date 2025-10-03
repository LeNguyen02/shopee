import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from 'src/apis/admin.api'
import { FlashSale, Product } from 'src/types/product.type'
import Button from 'src/components/Button'
import { toast } from 'react-toastify'

// Helper: convert 'YYYY-MM-DDTHH:mm' (local) -> 'YYYY-MM-DD HH:mm:00'
function toMySqlDateTime(localDatetimeValue: string) {
  if (!localDatetimeValue) return ''
  const withSeconds = localDatetimeValue.length === 16 ? `${localDatetimeValue}:00` : localDatetimeValue
  return withSeconds.replace('T', ' ')
}

// Interpret MySQL DATETIME (stored as UTC) as UTC Date
function parseMysqlAsUtc(mysqlDatetimeValue: string) {
  // Expect format 'YYYY-MM-DD HH:mm:ss'
  const isoLike = mysqlDatetimeValue.replace(' ', 'T') + 'Z'
  const d = new Date(isoLike)
  return d
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

// Convert DB UTC time -> local input value 'YYYY-MM-DDTHH:mm' (display as UTC+7 to admins)
function toInputDateTime(mysqlDatetimeValue: string) {
  if (!mysqlDatetimeValue) return ''
  const adjusted = new Date(parseMysqlAsUtc(mysqlDatetimeValue).getTime() + 7 * 60 * 60 * 1000)
  const y = adjusted.getFullYear()
  const M = pad2(adjusted.getMonth() + 1)
  const d = pad2(adjusted.getDate())
  const h = pad2(adjusted.getHours())
  const m = pad2(adjusted.getMinutes())
  return `${y}-${M}-${d}T${h}:${m}`
}

export default function FlashSaleManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isItemsOpen, setIsItemsOpen] = useState(false)
  const [editing, setEditing] = useState<FlashSale | null>(null)
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-flash-sales', page, search, status],
    queryFn: () => adminApi.getFlashSales({ page, limit, search, status })
  })

  const list: FlashSale[] = data?.data.data.flash_sales || []
  const pagination = data?.data.data.pagination

  // Create form state
  const [createForm, setCreateForm] = useState({ name: '', start_time: '', end_time: '', is_active: 1 as 0 | 1 })
  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: createForm.name,
        start_time: toMySqlDateTime(createForm.start_time),
        end_time: toMySqlDateTime(createForm.end_time),
        is_active: createForm.is_active
      }
      return adminApi.createFlashSale(payload)
    },
    onSuccess: (res) => {
      toast.success('Tạo flash sale thành công')
      setIsCreateOpen(false)
      setCreateForm({ name: '', start_time: '', end_time: '', is_active: 1 })
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi tạo flash sale')
  })

  // Update form state
  const [editForm, setEditForm] = useState({ name: '', start_time: '', end_time: '', is_active: 1 as 0 | 1 })
  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: editForm.name,
        start_time: toMySqlDateTime(editForm.start_time),
        end_time: toMySqlDateTime(editForm.end_time),
        is_active: editForm.is_active
      }
      return adminApi.updateFlashSale(editing!.id, payload)
    },
    onSuccess: () => {
      toast.success('Cập nhật flash sale thành công')
      setIsEditOpen(false)
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi cập nhật flash sale')
  })

  // Items management state
  const [items, setItems] = useState<Array<{ product_id: number; sale_price: number; item_limit?: number | null; discount_percent?: number; product_price?: number }>>([])
  const [openPicker, setOpenPicker] = useState<number | null>(null)

  // Product search for dropdown
  const [productSearch, setProductSearch] = useState('')
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-for-flash', productSearch],
    queryFn: () => adminApi.getProducts({ page: 1, limit: 50, search: productSearch, category: '' })
  })
  const productOptions: Product[] = productsData?.data.data.products || []
  const addItemsMutation = useMutation({
    mutationFn: () => {
      const payload = items
        .map(i => {
          const basePrice = i.product_price
          let salePrice = i.sale_price
          if ((i.discount_percent !== undefined && i.discount_percent !== null) && basePrice && basePrice > 0) {
            const pct = Math.min(100, Math.max(0, Number(i.discount_percent)))
            salePrice = Math.max(0, Math.round((basePrice * (100 - pct)) / 100))
          }
          return { product_id: i.product_id, sale_price: salePrice, item_limit: i.item_limit ?? null }
        })
        .filter(i => i.product_id && i.sale_price && i.sale_price > 0)
      return adminApi.addFlashSaleItems(currentSaleId!, payload)
    },
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm flash sale thành công')
      setIsItemsOpen(false)
      setItems([])
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi cập nhật sản phẩm')
  })

  // Display helper: DB time (UTC) -> local string shown to admin (UTC+7)
  const formatDate = (mysql: string) => {
    if (!mysql) return ''
    const adjusted = new Date(parseMysqlAsUtc(mysql).getTime() + 7 * 60 * 60 * 1000)
    return adjusted.toLocaleString()
  }

  const handleOpenEdit = (sale: FlashSale) => {
    setEditing(sale)
    setEditForm({ name: sale.name, start_time: toInputDateTime(sale.start_time), end_time: toInputDateTime(sale.end_time), is_active: sale.is_active })
    setIsEditOpen(true)
  }

  const handleOpenItems = (sale: FlashSale) => {
    setCurrentSaleId(sale.id)
    setItems((sale.items || []).map(i => ({ product_id: i.product_id, sale_price: Number(i.sale_price), item_limit: i.item_limit ?? null })))
    setIsItemsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Flash Sale</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
          <i className="fas fa-plus mr-2"></i>
          Tạo Flash Sale
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1) }} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nhập tên flash sale..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả</option>
              <option value="active">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>
          </div>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
            <i className="fas fa-search mr-2"></i>
            Tìm kiếm
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bắt đầu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết thúc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list.map(sale => {
                const now = Date.now()
                // Adjust DB UTC times to UTC+7 for comparison in admin UI
                const st = new Date(parseMysqlAsUtc(sale.start_time).getTime() + 7 * 60 * 60 * 1000).getTime()
                const en = new Date(parseMysqlAsUtc(sale.end_time).getTime() + 7 * 60 * 60 * 1000).getTime()
                const state = now < st ? 'Sắp diễn ra' : now > en ? 'Đã kết thúc' : 'Đang diễn ra'
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.start_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.end_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${state === 'Đang diễn ra' ? 'bg-green-100 text-green-700' : state === 'Sắp diễn ra' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{state}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.items?.length ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleOpenEdit(sale)} className="text-indigo-600 hover:text-indigo-900" title="Chỉnh sửa">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleOpenItems(sale)} className="text-amber-600 hover:text-amber-800" title="Thêm sản phẩm">
                        <i className="fas fa-plus-square"></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.page_size > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> đến <span className="font-medium">{Math.min(page * pagination.limit, pagination.total)}</span> của <span className="font-medium">{pagination.total}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: pagination.page_size }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${p === page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(pagination.page_size, page + 1))} disabled={page === pagination.page_size} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Tạo Flash Sale</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                <input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                  <input type="datetime-local" value={createForm.start_time} onChange={e => setCreateForm({ ...createForm, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                  <input type="datetime-local" value={createForm.end_time} onChange={e => setCreateForm({ ...createForm, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={createForm.is_active === 1} onChange={e => setCreateForm({ ...createForm, is_active: e.target.checked ? 1 : 0 })} />
                  Kích hoạt ngay
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded">Hủy</button>
                <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="px-4 py-2 text-sm text-white bg-blue-600 rounded disabled:opacity-50">{createMutation.isPending ? 'Đang tạo...' : 'Tạo'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa Flash Sale</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                  <input type="datetime-local" value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                  <input type="datetime-local" value={editForm.end_time} onChange={e => setEditForm({ ...editForm, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={editForm.is_active === 1} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked ? 1 : 0 })} />
                  Đang kích hoạt
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded">Hủy</button>
                <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="px-4 py-2 text-sm text-white bg-blue-600 rounded disabled:opacity-50">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Modal */}
      {isItemsOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Thêm sản phẩm vào Flash Sale</h3>
              <button onClick={() => setIsItemsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setItems(prev => [...prev, { product_id: 0, sale_price: 0 }])} className="bg-gray-700 text-white px-3 py-1 rounded">Thêm dòng</button>
                <div className="flex items-center gap-2">
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="border p-2 rounded w-64" />
                  <span className="text-sm text-gray-500">{productOptions.length} sản phẩm</span>
                </div>
              </div>
              {items.map((it, idx) => {
                const selected = productOptions.find(p => p.id === it.product_id)
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                    {/* Product picker with image + name */}
                    <div className="md:col-span-3 relative">
                      <button
                        type="button"
                        className="w-full border p-2 rounded flex items-center justify-between hover:border-gray-400"
                        onClick={() => setOpenPicker(prev => (prev === idx ? null : idx))}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {selected?.image ? (
                            <img src={selected.image} alt={selected.name} className="w-8 h-8 object-cover rounded border" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-gray-400">
                              <i className="fas fa-image"></i>
                            </div>
                          )}
                          <span className="text-sm text-gray-800 truncate">
                            {selected ? selected.name : (it.product_id ? `Sản phẩm #${it.product_id}` : 'Chọn sản phẩm...')}
                          </span>
                        </div>
                        <i className={`fas fa-chevron-${openPicker === idx ? 'up' : 'down'} text-gray-500 ml-2`}></i>
                      </button>
                      {openPicker === idx && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-72 overflow-auto">
                          {productOptions.length === 0 && (
                            <div className="p-3 text-sm text-gray-500">Không có sản phẩm phù hợp</div>
                          )}
                          {productOptions.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
                              onClick={() => {
                                const pid = p.id
                                setItems(prev => prev.map((x, i) => {
                                  if (i !== idx) return x
                                  const base = p.price
                                  let sale = x.sale_price
                                  if (x.discount_percent !== undefined && base && base > 0) {
                                    const pct = Math.min(100, Math.max(0, Number(x.discount_percent)))
                                    sale = Math.max(0, Math.round((base * (100 - pct)) / 100))
                                  }
                                  return { ...x, product_id: pid, product_price: base, sale_price: sale }
                                }))
                                setOpenPicker(null)
                              }}
                            >
                              <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded border" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 truncate">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.price.toLocaleString()}đ</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                    className="border p-2 rounded md:col-span-1"
                    type="number"
                    placeholder="% giảm"
                    value={it.discount_percent ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value)
                      setItems(prev => prev.map((x, i) => {
                        if (i !== idx) return x
                        let sale = x.sale_price
                        if (val !== undefined && x.product_price && x.product_price > 0) {
                          const pct = Math.min(100, Math.max(0, Number(val)))
                          sale = Math.max(0, Math.round((x.product_price * (100 - pct)) / 100))
                        }
                        return { ...x, discount_percent: val, sale_price: sale }
                      }))
                    }}
                    />

                    <input
                    className="border p-2 rounded md:col-span-1"
                    type="number"
                    placeholder="Giá sale"
                    value={it.sale_price}
                    onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, sale_price: Number(e.target.value) } : x))}
                    />

                    <input
                    className="border p-2 rounded md:col-span-1"
                    type="number"
                    placeholder="Giới hạn (tuỳ chọn)"
                    value={it.item_limit ?? ''}
                    onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, item_limit: e.target.value === '' ? null : Number(e.target.value) } : x))}
                    />

                    <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="bg-red-500 text-white px-3 py-2 rounded">Xóa</button>
                  </div>
                )
              })}
              {/* Existing items list for quick view and delete */}
              {currentSaleId && editing == null && (
                <ExistingItems saleId={currentSaleId} onDeleted={() => { /* no-op, modal state already detached */ }} />
              )}
              <div className="flex justify-end">
                <button onClick={() => addItemsMutation.mutate()} disabled={addItemsMutation.isPending} className="bg-green-600 text-white px-4 py-2 rounded">{addItemsMutation.isPending ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function ExistingItems({ saleId, onDeleted }: { saleId: number; onDeleted?: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ['admin-flash-sale-detail', saleId],
    queryFn: () => adminApi.getFlashSaleDetail(saleId)
  })
  const sale: FlashSale | undefined = data?.data.data
  const deleteMutation = useMutation({
    mutationFn: (productId: number) => adminApi.deleteFlashSaleItem(saleId, productId),
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm khỏi flash sale')
      refetch()
      onDeleted && onDeleted()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi xóa sản phẩm')
  })

  if (!sale) return null

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="font-semibold text-gray-800 mb-3">Sản phẩm hiện có</h4>
      <div className="max-h-72 overflow-auto divide-y">
        {(sale.items || []).map(item => (
          <div key={item.id} className="py-2 flex items-center gap-3">
            <img src={item.product_image || ''} alt={item.product_name || ''} className="w-10 h-10 object-cover rounded border" />
            <div className="flex-1">
              <div className="text-sm text-gray-900">{item.product_name}</div>
              <div className="text-xs text-gray-500">Giá sale: {Number(item.sale_price).toLocaleString()}đ {item.item_limit ? `• Giới hạn: ${item.item_limit}` : ''}</div>
            </div>
            <button onClick={() => deleteMutation.mutate(item.product_id)} className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-200 rounded">Xóa</button>
          </div>
        ))}
      </div>
    </div>
  )
}

