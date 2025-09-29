import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import paymentApi from 'src/apis/payment.api'
import { Order } from 'src/types/payment.type'
import Button from 'src/components/Button'
import { formatCurrency } from 'src/utils/utils'
import { getImageUrl, handleImageError } from 'src/utils/imageUtils'
import { useTranslation } from 'react-i18next'

interface LocationState {
	order: Order
}

export default function MomoPayment() {
	const navigate = useNavigate()
	const location = useLocation()
	const { order } = (location.state || {}) as LocationState
	const [transferNote, setTransferNote] = useState('')
	const { t } = useTranslation('payment')

	useEffect(() => {
		if (!order) {
			toast.error(t('momo.missing_order'))
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
			toast.success(t('momo.confirmed'))
			navigate('/user/orders')
		}
	})

	const settings = settingsData?.data.data.settings || { name: '', account_number: '', qr_image_url: '', instructions: '' }

	return (
		<div className='bg-neutral-100 py-16'>
			<div className='container'>
				<div className='max-w-5xl mx-auto bg-white rounded-lg shadow p-8'>
					<h1 className='text-4xl font-bold mb-5'>{t('momo.title')}</h1>
					<p className='text-lg text-gray-600 mb-8'>{t('momo.instruction')}</p>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
						<div>
							<h2 className='font-semibold text-2xl mb-3'>{t('momo.shop_momo')}</h2>
							<div className='space-y-2'>
								<div className='text-lg'><span className='font-semibold'>{t('momo.name')}:</span> {settings.name || t('momo.updating')}</div>
								<div className='text-lg'><span className='font-semibold'>{t('momo.account_number')}:</span> {settings.account_number || t('momo.updating')}</div>
								{settings.instructions && (
									<div className='text-base text-gray-600'>{settings.instructions}</div>
								)}
							</div>
						</div>
						<div className='flex items-center justify-center'>
							{settings.qr_image_url ? (
								<img src={getImageUrl(settings.qr_image_url)} onError={handleImageError} alt='MoMo QR' className='w-full max-w-[560px] h-auto object-contain border rounded' />
							) : (
								<div className='w-full max-w-[560px] aspect-square border rounded flex items-center justify-center text-gray-400 text-lg'>{t('momo.no_qr')}</div>
							)}
						</div>
					</div>

					<div className='mt-8 p-5 bg-orange-50 border border-orange-200 rounded'>
						<h3 className='font-semibold text-2xl mb-3'>{t('momo.transfer_note')}</h3>
						<div className='flex items-center gap-2'>
							<input value={transferNote} readOnly className='flex-1 px-4 py-3 border rounded text-lg' />
							<Button className='px-5 py-3 text-lg' onClick={() => navigator.clipboard.writeText(transferNote)}>{t('momo.copy')}</Button>
						</div>
						<p className='text-base text-gray-600 mt-3'>{t('momo.note_hint')}</p>
					</div>

					<div className='mt-8 flex items-center justify-between'>
						<div>
							<p className='text-xl'>{t('momo.total')}</p>
							<p className='text-3xl font-bold text-orange'>₫{formatCurrency(order.total_amount)}</p>
						</div>
						<Button className='bg-orange text-white px-8 py-4 rounded text-lg' onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
							{confirmMutation.isPending ? t('momo.confirming') : t('momo.i_paid')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
} 