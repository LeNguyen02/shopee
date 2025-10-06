import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import adminApi from 'src/apis/admin.api'
import { getImageUrl, handleImageError } from 'src/utils/imageUtils'

export default function SettingsManagement() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-momo-settings'],
    queryFn: () => adminApi.getMomoSettings()
  })

  const [name, setName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [qrFile, setQrFile] = useState<File | null>(null)

  useEffect(() => {
    const settings = data?.data.data.settings
    if (settings) {
      setName(settings.name || '')
      setAccountNumber(settings.account_number || '')
      setQrUrl(settings.qr_image_url || '')
      setInstructions(settings.instructions || '')
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateMomoSettings({ name, account_number: accountNumber, qr_image_url: qrUrl, instructions }),
    onSuccess: () => {
      toast.success('Đã cập nhật MoMo settings')
    },
    onError: () => {
      toast.error('Cập nhật thất bại')
    }
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadImage(file),
    onSuccess: (res) => {
      const url = res.data.data.url
      setQrUrl(url)
      toast.success('Upload QR thành công')
    },
    onError: () => {
      toast.error('Upload QR thất bại')
    }
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cài đặt thanh toán</h2>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">MoMo</h3>
        {isLoading ? (
          <div>Đang tải...</div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên chủ MoMo</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số tài khoản</label>
              <input className="w-full border rounded px-3 py-2" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium mb-1">QR image URL</label>
                <input className="w-full border rounded px-3 py-2" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} />
                <div className="mt-2 flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-60"
                    disabled={!qrFile || uploadMutation.isPending}
                    onClick={() => qrFile && uploadMutation.mutate(qrFile)}
                  >
                    {uploadMutation.isPending ? 'Đang upload...' : 'Upload ảnh'}
                  </button>
                </div>
              </div>
              <div className="border rounded p-2 flex items-center justify-center min-h-40">
                {qrUrl ? (
                  <img src={getImageUrl(qrUrl)} onError={handleImageError} alt="MoMo QR" className="max-h-60 object-contain" />
                ) : (
                  <span className="text-gray-400">Chưa có QR</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hướng dẫn</label>
              <textarea className="w-full border rounded px-3 py-2" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 