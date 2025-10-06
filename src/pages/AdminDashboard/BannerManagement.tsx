import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import bannerApi, { Banner } from 'src/apis/banner.api'
import { getImageUrl } from 'src/utils/imageUtils'

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState('')
  const [position, setPosition] = useState<'main' | 'right'>('main')
  const [loading, setLoading] = useState(false)

  const fetchBanners = async () => {
    try {
      const res = await bannerApi.getBanners({ position, all: '1' })
      setBanners(res.data.data)
    } catch (e) {
      toast.error('Không thể tải banners')
    }
  }

  useEffect(() => {
    fetchBanners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position])

  const handleUpload = async () => {
    if (!file) {
      toast.warn('Chọn ảnh trước')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      if (link) form.append('link', link)
      form.append('position', position)
      const res = await bannerApi.createBanner(form)
      toast.success('Tải lên thành công')
      setFile(null)
      setLink('')
      setBanners((prev) => [res.data.data, ...prev])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa banner này?')) return
    try {
      await bannerApi.deleteBanner(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
      toast.success('Đã xóa')
    } catch (e) {
      toast.error('Xóa thất bại')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Quản lý Banner</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <select value={position} onChange={(e) => setPosition(e.target.value as any)} className="border px-3 py-2 rounded">
            <option value="main">Main</option>
            <option value="right">Right</option>
          </select>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Liên kết (tùy chọn)"
            className="border px-3 py-2 rounded w-80"
          />
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >{loading ? 'Đang tải...' : 'Tải lên'}</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="border rounded overflow-hidden">
              <img src={getImageUrl(b.image)} alt="banner" className="w-full h-32 object-cover" />
              <div className="p-2 flex items-center justify-between text-sm">
                <span>#{b.id}</span>
                <button onClick={() => handleDelete(b.id)} className="text-red-600">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


