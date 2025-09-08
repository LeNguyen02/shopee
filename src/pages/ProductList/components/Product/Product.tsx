import { Link } from 'react-router-dom'
import ProductRating from 'src/components/ProductRating'
import path from 'src/constants/path'
import { Product as ProductType } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, generateNameId } from 'src/utils/utils'
import { getMainProductImage } from 'src/utils/imageUtils'

interface Props {
  product: ProductType
}

export default function Product({ product }: Props) {
  return (
    <Link to={`${path.productDetail}/${product.id}`}>
      <div className='overflow-hidden rounded-lg bg-white shadow-lg transition-transform duration-100 hover:translate-y-[-0.08rem] hover:shadow-xl h-full flex flex-col'>
        <div className='relative w-full pt-[100%] flex-shrink-0'>
          <img
            src={getMainProductImage(product)}
            alt={product.name}
            className='absolute top-0 left-0 h-full w-full bg-white object-cover'
          />
        </div>
        <div className='overflow-hidden p-4 flex flex-col flex-grow'>
          <div className='min-h-[3rem] max-h-[3rem] text-2xl line-clamp-2 flex items-start'>{product.name}</div>
          <div className='mt-4 flex items-center flex-shrink-0'>
            {product.price_before_discount && product.price_before_discount > product.price && (
              <div className='max-w-[50%] truncate text-gray-500 line-through'>
                <span className='text-2xl'>₫</span>
                <span className='text-2xl'>{formatCurrency(product.price_before_discount)}</span>
              </div>
            )}
            <div className='ml-2 truncate text-orange'>
              <span className='text-2xl'>₫</span>
              <span className='text-4xl font-bold'>{formatCurrency(product.price)}</span>
            </div>
          </div>
          <div className='mt-auto pt-4 flex items-center justify-end flex-shrink-0'>
            <ProductRating rating={product.rating} />
            <div className='ml-2 text-xl'>
              <span>{formatNumberToSocialStyle(product.sold)}</span>
              <span className='ml-1'>Đã bán</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
