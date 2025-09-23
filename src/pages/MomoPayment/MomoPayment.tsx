import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import paymentApi from 'src/apis/payment.api'
import { Order } from 'src/types/payment.type'
import Button from 'src/components/Button'
import { formatCurrency } from 'src/utils/utils'
import { getImageUrl, handleImageError } from 'src/utils/imageUtils'

interface LocationState {
	order: Order
}

export default function MomoPayment() {
	const navigate = useNavigate()
	const location = useLocation()
	const { order } = (location.state || {}) as LocationState
	const [transferNote, setTransferNote] = useState('')

	useEffect(() => {
		if (!order) {
			toast.error('Thiếu thông tin đơn hàng')
			navigate('/')
		}
	}, [order, navigate])

	const { data: settingsData } = useQuery({
		queryKey: ['momo-settings'],
		queryFn: () => paymentApi.getMomoSettings()
	})

	useEffect(() => {
		if (order) {
			setTransferNote(`ORDER-${order.id}-${order.user_id}`)
		}
	}, [order])

	const confirmMutation = useMutation({
		mutationFn: () => paymentApi.confirmMomoTransfer(order.id.toString(), transferNote),
		onSuccess: () => {
			toast.success('Đã ghi nhận xác nhận thanh toán. Vui lòng chờ admin kiểm tra.')
			navigate('/user/orders')
		}
	})

	const settings = settingsData?.data.data.settings || { name: '', account_number: '', qr_image_url: '', instructions: '' }

	return (
		<div className='bg-neutral-100 py-16'>
			<div className='container'>
				<div className='max-w-3xl mx-auto bg-white rounded-lg shadow p-6'>
					<h1 className='text-3xl font-bold mb-4'>Thanh toán MoMo</h1>
					<p className='text-gray-600 mb-6'>Vui lòng thực hiện chuyển khoản MoMo theo thông tin dưới đây và nhập đúng mã ghi chú.</p>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<h2 className='font-semibold text-xl mb-2'>Thông tin MoMo của shop</h2>
							<div className='space-y-2'>
								<div><span className='font-medium'>Tên:</span> {settings.name || 'Đang cập nhật'}</div>
								<div><span className='font-medium'>Số tài khoản:</span> {settings.account_number || 'Đang cập nhật'}</div>
								{settings.instructions && (
									<div className='text-sm text-gray-600'>{settings.instructions}</div>
								)}
							</div>
						</div>
						<div className='flex items-center justify-center'>
							{settings.qr_image_url ? (
								<img src={getImageUrl(settings.qr_image_url)} onError={handleImageError} alt='MoMo QR' className='w-64 h-64 object-contain border rounded' />
							) : (
								<div className='w-64 h-64 border rounded flex items-center justify-center text-gray-400'>Chưa có QR</div>
							)}
						</div>
					</div>

					<div className='mt-6 p-4 bg-orange-50 border border-orange-200 rounded'>
						<h3 className='font-semibold mb-2'>Mã ghi chú khi chuyển khoản</h3>
						<div className='flex items-center gap-2'>
							<input value={transferNote} readOnly className='flex-1 px-3 py-2 border rounded' />
							<Button onClick={() => navigator.clipboard.writeText(transferNote)}>Sao chép</Button>
						</div>
						<p className='text-sm text-gray-600 mt-2'>Vui lòng nhập chính xác mã này ở phần ghi chú để hệ thống đối soát.</p>
					</div>

					<div className='mt-6 flex items-center justify-between'>
						<div>
							<p>Tổng tiền:</p>
							<p className='text-2xl font-bold text-orange'>₫{formatCurrency(order.total_amount)}</p>
						</div>
						<Button className='bg-orange text-white px-6 py-3 rounded' onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
							{confirmMutation.isPending ? 'Đang xác nhận...' : 'Tôi đã thanh toán'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
} 