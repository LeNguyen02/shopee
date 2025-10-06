import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useEffect } from 'react'
import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'
import Pagination from 'src/components/Pagination'
import useQueryConfig from 'src/hooks/useQueryConfig'
import { ProductListConfig } from 'src/types/product.type'
import AsideFilter from '../ProductList/components/AsideFilter'
import Product from '../ProductList/components/Product/Product'
import SortProductList from '../ProductList/components/SortProductList'

export default function Search() {
  const queryConfig = useQueryConfig()

  // Scroll to top when component mounts or search parameters change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [queryConfig])

  const { data: productsData } = useQuery({
    queryKey: ['products', 'search', queryConfig],
    queryFn: () => {
      return productApi.getProducts(queryConfig as ProductListConfig)
    },
    staleTime: 3 * 60 * 1000
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => {
      return categoryApi.getCategories()
    }
  })

  const searchKeyword = queryConfig.name || ''

  return (
    <div id='container' className='bg-gray-200 py-8'>
      <Helmet>
        <title>{searchKeyword ? `Kết quả tìm kiếm cho "${searchKeyword}"` : 'Tìm kiếm'} | Shopee Clone</title>
        <meta name='description' content='Tìm kiếm sản phẩm trên Shopee Clone' />
      </Helmet>
      <div className='container'>
        {productsData?.data?.data && (
          <div className='grid grid-cols-12 gap-8'>
            <div className='col-span-3'>
              <AsideFilter queryConfig={queryConfig} categories={categoriesData?.data.data || []} pathname="/search" />
            </div>
            <div className='col-span-9'>
              <SortProductList queryConfig={queryConfig} pageSize={productsData.data.data.pagination.page_size} />
              <div className='mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 items-stretch'>
                {productsData.data.data.products.map((product) => (
                  <div className='col-span-1' key={product._id}>
                    <Product product={product} />
                  </div>
                ))}
              </div>
              <Pagination queryConfig={queryConfig} pageSize={productsData.data.data.pagination.page_size} pathname="/search" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
