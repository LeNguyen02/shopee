import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import DOMPurify from 'dompurify'
import { convert } from 'html-to-text'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { toast } from 'react-toastify'
import productApi from 'src/apis/product.api'
import cartApi from 'src/apis/cart.api'
import ProductRating from 'src/components/ProductRating'
import QuantityController from 'src/components/QuantityController'
import path from 'src/constants/path'
import { purchasesStatus } from 'src/constants/purchase'
import {
  Product as ProductType,
  ProductListConfig,
  FlashSale
} from 'src/types/product.type'
import {
  formatCurrency,
  formatNumberToSocialStyle,
  getIdFromNameId,
  rateSale
} from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'

import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import Product from '../ProductList/components/Product'

export default function ProductDetail() {
  const { t } = useTranslation(['product'])
  const queryClient = useQueryClient()
  const [buyCount, setBuyCount] = useState(1)
  const { id } = useParams()
  const { data: productDetailData } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProductDetail(id as string)
  })
  // Active flash sale for countdown
  const { data: flashSaleRes } = useQuery({
    queryKey: ['flash-sale-active'],
    queryFn: () => productApi.getActiveFlashSale(),
    staleTime: 30 * 1000
  })
  const flashSale: FlashSale | null = flashSaleRes?.data?.data || null
  const [remaining, setRemaining] = useState<{ h: string; m: string; s: string }>({ h: '00', m: '00', s: '00' })
  const [currentIndexImages, setCurrentIndexImages] = useState([0, 5])
  const [activeImage, setActiveImage] = useState('')
  const product = productDetailData?.data.data
  const imageRef = useRef<HTMLImageElement>(null)
  const currentImages = useMemo(() => {
    if (!product) return []
    
    // Use images array if available, otherwise use single image
    const imagesArray = product.images && product.images.length > 0 
      ? product.images 
      : product.image 
        ? [product.image] 
        : []
    
    return imagesArray.slice(...currentIndexImages).map(getImageUrl)
  }, [product, currentIndexImages])
  const queryConfig: ProductListConfig = { limit: '20', page: '1', category: product?.category_id?.toString() }

  const { data: productsData } = useQuery({
    queryKey: ['products', queryConfig],
    queryFn: () => {
      return productApi.getProducts(queryConfig)
    },
    staleTime: 3 * 60 * 1000,
    enabled: Boolean(product)
  })
  const addToCartMutation = useMutation({
    mutationFn: cartApi.addToCart,
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng'
      toast.error(message)
    }
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (product) {
      const firstImage = product.images?.[0] || product.image
      if (firstImage) {
        setActiveImage(getImageUrl(firstImage))
      }
    }
  }, [product])

  // Countdown timer for product if included in active flash sale
  useEffect(() => {
    if (!flashSale) return
    const item = flashSale.items.find(i => i.product_id === product?.id)
    if (!item) return
    const end = new Date(flashSale.end_time).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, end - now)
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      setRemaining({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0')
      })
      if (diff === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [flashSale, product?.id])

  const next = () => {
    const imagesArray = product?.images && product.images.length > 0 
      ? product.images 
      : product?.image 
        ? [product.image] 
        : []
    
    if (currentIndexImages[1] < imagesArray.length) {
      setCurrentIndexImages((prev) => [prev[0] + 1, prev[1] + 1])
    }
  }

  const prev = () => {
    if (currentIndexImages[0] > 0) {
      setCurrentIndexImages((prev) => [prev[0] - 1, prev[1] - 1])
    }
  }

  const chooseActive = (img: string) => {
    setActiveImage(img)
  }

  const handleZoom = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const image = imageRef.current as HTMLImageElement
    const { naturalHeight, naturalWidth } = image
    // Cách 1: Lấy offsetX, offsetY đơn giản khi chúng ta đã xử lý được bubble event
    // const { offsetX, offsetY } = event.nativeEvent

    // Cách 2: Lấy offsetX, offsetY khi chúng ta không xử lý được bubble event
    const offsetX = event.pageX - (rect.x + window.scrollX)
    const offsetY = event.pageY - (rect.y + window.scrollY)

    const top = offsetY * (1 - naturalHeight / rect.height)
    const left = offsetX * (1 - naturalWidth / rect.width)
    image.style.width = naturalWidth + 'px'
    image.style.height = naturalHeight + 'px'
    image.style.maxWidth = 'unset'
    image.style.top = top + 'px'
    image.style.left = left + 'px'
  }

  const handleRemoveZoom = () => {
    imageRef.current?.removeAttribute('style')
  }

  const handleBuyCount = (value: number) => {
    setBuyCount(value)
  }

  const addToCart = () => {
    addToCartMutation.mutate(
      { product_id: product?.id?.toString() as string, quantity: buyCount },
      {
        onSuccess: (data) => {
          toast.success(data.data.message, { autoClose: 1000 })
          queryClient.invalidateQueries({ queryKey: ['cart'] })
        }
      }
    )
  }

  const buyNow = async () => {
    try {
      const res = await addToCartMutation.mutateAsync({ product_id: product?.id?.toString() as string, quantity: buyCount })
      navigate(path.cart)
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  }

  if (!product) return null
  return (
    <div id='container' className='bg-gray-200 py-6'>
      <Helmet>
        <title>{product.name} | Shopee Clone</title>
        <meta
          name='description'
          content={convert(product.description, {
            limits: {
              maxInputLength: 150
            }
          })}
        />
      </Helmet>
      <div className='container  mt-[20px]'>
        {flashSale && flashSale.items.some(i => i.product_id === product.id) && (
          <div className='mb-4 bg-white rounded p-4 flex items-center gap-3'>
            <img src="/assets/img/flash-sale/flash-sale-icon.png" alt="Flash Sale" className="w-[10rem] h-10" />
            <div className='text-red-600 font-semibold text-2xl'>Flash Sale đang diễn ra</div>
            <div className='ml-auto flex items-center gap-1 text-black font-mono text-2xl'>
              <span className='bg-black text-white px-2 py-1 rounded'>{remaining.h}</span>
              :
              <span className='bg-black text-white px-2 py-1 rounded'>{remaining.m}</span>
              :
              <span className='bg-black text-white px-2 py-1 rounded'>{remaining.s}</span>
            </div>
          </div>
        )}
        <div className='bg-white p-3 md:p-4 shadow'>
          <div className='grid grid-cols-12 gap-4 md:gap-9'>
            <div className='col-span-12 md:col-span-5'>
              <div
                className='relative w-full cursor-zoom-in overflow-hidden pt-[100%] shadow'
                onMouseMove={handleZoom}
                onMouseLeave={handleRemoveZoom}
              >
                <img
                  src={activeImage}
                  alt={product.name}
                  className='absolute top-0 left-0 h-full w-full bg-white object-cover'
                  ref={imageRef}
                />
              </div>
              <div className='relative mt-4 grid grid-cols-5 gap-1'>
                <button
                  className='absolute left-0 top-1/2 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
                  onClick={prev}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
                  </svg>
                </button>
                {currentImages.map((img) => {
                  const isActive = img === activeImage
                  return (
                    <div className='relative w-full pt-[100%]' key={img} onMouseEnter={() => chooseActive(img)}>
                      <img
                        src={img}
                        alt={product.name}
                        className='absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-cover'
                      />
                      {isActive && <div className='absolute inset-0 border-2 border-orange' />}
                    </div>
                  )
                })}
                <button
                  className='absolute right-0 top-1/2 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
                  onClick={next}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                  </svg>
                </button>
              </div>
            </div>
            <div className='col-span-12 md:col-span-7 md:pl-20 md:pt-10 pt-4'>
              <h1 className='text-2xl md:text-6xl font-bold uppercase leading-snug'>{product.name}</h1>
              <div className='mt-3 md:mt-8 flex items-center flex-wrap gap-2'>
                <div className='flex items-center'>
                  <span className='mr-1 border-b border-b-orange text-orange text-xl md:text-3xl font-semibold'>{product.rating}</span>
                  <ProductRating
                    rating={product.rating}
                    activeClassname='fill-orange text-orange h-4 w-4 md:h-6 md:w-6'
                    nonActiveClassname='fill-gray-300 text-gray-300 h-4 w-4 md:h-6 md:w-6'
                  />
                </div>
                <div className='mx-4 h-5 md:h-6 w-[1px] bg-gray-300'></div>
                <div>
                  <span className='text-xl md:text-3xl font-medium'>{formatNumberToSocialStyle(product.sold)}</span>
                  <span className='ml-3 text-gray-500 text-lg md:text-2xl'>Đã bán</span>
                </div>
              </div>
              <div className='mt-4 md:mt-8 flex items-center flex-wrap gap-3 bg-gray-50 px-4 md:px-6 py-4 md:py-6'>
                <div className='text-gray-500 line-through text-xl md:text-3xl'>₫{formatCurrency(product.price_before_discount)}</div>
                <div className='md:ml-3 text-3xl md:text-5xl font-bold text-orange'>₫{formatCurrency(product.price)}</div>
                <div className='md:ml-4 rounded-sm bg-orange px-2 py-1 text-sm md:text-xl font-semibold uppercase text-white'>
                  {rateSale(product.price_before_discount, product.price)} giảm
                </div>
              </div>
              <div className='mt-4 md:mt-8 flex items-center flex-wrap gap-3'>
                <div className='capitalize text-gray-500 text-base md:text-xl font-medium'>Số lượng</div>
                <QuantityController
                  onDecrease={handleBuyCount}
                  onIncrease={handleBuyCount}
                  onType={handleBuyCount}
                  value={buyCount}
                  max={product.quantity}
                />
                <div className='md:ml-6 text-base md:text-xl text-gray-500'>
                  {product.quantity} {t('product:available')}
                </div>
              </div>
              
              {/* Stock Status Indicators */}
              {product.quantity === 0 && (
                <div className='mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-xl'>
                  <strong>Sản phẩm đã hết hàng</strong>
                </div>
              )}
              
              {product.quantity > 0 && product.quantity <= 5 && (
                <div className='mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xl'>
                  <strong>Chỉ còn {product.quantity} sản phẩm</strong> - Đặt hàng ngay!
                </div>
              )}
              <div className='mt-8 md:mt-20 flex items-center'>
                <button
                  onClick={addToCart}
                  disabled={product.quantity === 0 || addToCartMutation.isPending}
                  className={`flex h-12 md:h-20 items-center justify-center rounded-sm border px-4 md:px-6 capitalize shadow-sm text-base md:text-2xl font-medium ${
                    product.quantity === 0 
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-orange bg-orange/10 text-orange hover:bg-orange/5'
                  }`}
                >
                  <svg
                    enableBackground='new 0 0 15 15'
                    viewBox='0 0 15 15'
                    x={0}
                    y={0}
                    className={`mr-[10px] h-5 w-5 md:h-6 md:w-6 fill-current ${
                      product.quantity === 0 ? 'stroke-gray-400 text-gray-400' : 'stroke-orange text-orange'
                    }`}
                  >
                    <g>
                      <g>
                        <polyline
                          fill='none'
                          points='.5 .5 2.7 .5 5.2 11 12.4 11 14.5 3.5 3.7 3.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeMiterlimit={10}
                        />
                        <circle cx={6} cy='13.5' r={1} stroke='none' />
                        <circle cx='11.5' cy='13.5' r={1} stroke='none' />
                      </g>
                      <line fill='none' strokeLinecap='round' strokeMiterlimit={10} x1='7.5' x2='10.5' y1={7} y2={7} />
                      <line fill='none' strokeLinecap='round' strokeMiterlimit={10} x1={9} x2={9} y1='8.5' y2='5.5' />
                    </g>
                  </svg>
                  {addToCartMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
                <button
                  onClick={buyNow}
                  disabled={product.quantity === 0 || addToCartMutation.isPending}
                  className={`flex ml-3 md:ml-4 h-12 md:h-20 w-44 md:w-80 items-center justify-center rounded-sm px-4 md:px-6 capitalize shadow-sm outline-none text-base md:text-2xl font-medium ${
                    product.quantity === 0 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-orange text-white hover:bg-orange/90'
                  }`}
                >
                  {addToCartMutation.isPending ? 'Đang xử lý...' : 'Mua ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-8'>
        <div className='container'>
          <div className=' bg-white p-4 shadow'>
            <div className='rounded bg-gray-50 p-4 text-2xl capitalize text-slate-700 font-semibold'>Mô tả sản phẩm</div>
            <div className='mx-4 mt-12 mb-4 text-xl leading-relaxed'>
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(product.description)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <div className='container'>
          <div className='uppercase text-gray-400 text-4xl font-bold'>CÓ THỂ BẠN CŨNG THÍCH</div>
                        {productsData && (
            <div className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch'>
              {productsData.data.data.products.map((relatedProduct) => (
                <div className='col-span-1' key={relatedProduct.id}>
                  <Product product={relatedProduct} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
