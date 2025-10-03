import React, {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  createSearchParams,
  Link
} from 'react-router-dom'
import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'
import path from 'src/constants/path'
import useQueryConfig from 'src/hooks/useQueryConfig'
import { Category } from 'src/types/category.type'
import {
  FlashSale,
  Product
} from 'src/types/product.type'
import {
  getImageUrl,
  getMainProductImage
} from 'src/utils/imageUtils'
import {
  formatCurrency,
  formatNumberToSocialStyle,
  rateSale
} from 'src/utils/utils'

import { useQuery } from '@tanstack/react-query'
import bannerApi from 'src/apis/banner.api'
import { useTranslation } from 'react-i18next'

// Custom Pagination Component with original UI design
function CustomPagination({ queryConfig, pageSize }: { queryConfig: any; pageSize: number }) {
    const page = Number(queryConfig.page) || 1
    const RANGE = 2

    const renderPagination = () => {
        let dotAfter = false
        let dotBefore = false

        const renderDotBefore = (index: number) => {
            if (!dotBefore) {
                dotBefore = true
                return (
                    <li key={index} className="pagination-item">
                        <span className="pagination-item__link">...</span>
                    </li>
                )
            }
            return null
        }

        const renderDotAfter = (index: number) => {
            if (!dotAfter) {
                dotAfter = true
                return (
                    <li key={index} className="pagination-item">
                        <span className="pagination-item__link">...</span>
                    </li>
                )
            }
            return null
        }

        return Array(pageSize)
            .fill(0)
            .map((_, index) => {
                const pageNumber = index + 1

                // Điều kiện để return về ...
                if (page <= RANGE * 2 + 1 && pageNumber > page + RANGE && pageNumber < pageSize - RANGE + 1) {
                    return renderDotAfter(index)
                } else if (page > RANGE * 2 + 1 && page < pageSize - RANGE * 2) {
                    if (pageNumber < page - RANGE && pageNumber > RANGE) {
                        return renderDotBefore(index)
                    } else if (pageNumber > page + RANGE && pageNumber < pageSize - RANGE + 1) {
                        return renderDotAfter(index)
                    }
                } else if (page >= pageSize - RANGE * 2 && pageNumber > RANGE && pageNumber < page - RANGE) {
                    return renderDotBefore(index)
                }

                return (
                    <li key={index} className={`pagination-item ${pageNumber === page ? 'pagination-item--active' : ''}`}>
                        <Link
                            to={{
                                pathname: path.home,
                                search: createSearchParams({
                                    ...queryConfig,
                                    page: pageNumber.toString()
                                }).toString()
                            }}
                            className="pagination-item__link"
                        >
                            {pageNumber}
                        </Link>
                    </li>
                )
            })
    }

    return (
        <ul className="pagination home-product__pagination">
            {/* Previous Button */}
            {page === 1 ? (
                <li className="pagination-item">
                    <span className="pagination-item__link">
                        <i className="fa-solid fa-chevron-left"></i>
                    </span>
                </li>
            ) : (
                <li className="pagination-item">
                    <Link
                        to={{
                            pathname: path.home,
                            search: createSearchParams({
                                ...queryConfig,
                                page: (page - 1).toString()
                            }).toString()
                        }}
                        className="pagination-item__link"
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </Link>
                </li>
            )}

            {/* Page Numbers */}
            {renderPagination()}

            {/* Next Button */}
            {page === pageSize ? (
                <li className="pagination-item">
                    <span className="pagination-item__link">
                        <i className="fa-solid fa-chevron-right"></i>
                    </span>
                </li>
            ) : (
                <li className="pagination-item">
                    <Link
                        to={{
                            pathname: path.home,
                            search: createSearchParams({
                                ...queryConfig,
                                page: (page + 1).toString()
                            }).toString()
                        }}
                        className="pagination-item__link"
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </Link>
                </li>
            )}
        </ul>
    )
}

function Home() {
    const { t } = useTranslation('home')
    const baseQueryConfig = useQueryConfig()

    // Set limit to 12 for 2 rows (6 products per row × 2 rows = 12 products)
    // Remove search parameters to only show today's suggestions
    const queryConfig = {
        ...baseQueryConfig,
        limit: '12', // Always use 12 products per page
        name: undefined // Remove search name to show suggestions instead of search results
    }

    // Fetch products for home page with pagination (2 rows = 12 products)
    const { data: productsData } = useQuery({
        queryKey: ['products', 'home', queryConfig],
        queryFn: () => {
            return productApi.getProducts(queryConfig as any)
        },
        staleTime: 3 * 60 * 1000
    })

    // Fetch categories for home page
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => {
            return categoryApi.getCategories()
        },
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    })

    const products = productsData?.data?.data?.products || []
    const pageSize = productsData?.data?.data?.pagination?.page_size || 1
    const categories = categoriesData?.data?.data || []

    // Flash sale
    const { data: flashSaleRes } = useQuery({
        queryKey: ['flash-sale-active'],
        queryFn: () => productApi.getActiveFlashSale(),
        staleTime: 30 * 1000
    })
    const flashSale: FlashSale | null = flashSaleRes?.data?.data || null
    const [remaining, setRemaining] = useState<{ h: string; m: string; s: string }>({ h: '00', m: '00', s: '00' })
    useEffect(() => {
        if (!flashSale) return
        const end = new Date(new Date(flashSale.end_time).getTime() - 7 * 60 * 60 * 1000).getTime()
        const tick = () => {
            const now = Date.now()
            const diff = Math.max(0, end - now)
            const hours = Math.floor(diff / 3600000)
            const minutes = Math.floor((diff % 3600000) / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)
            setRemaining({
                h: String(hours).padStart(2, '0'),
                m: String(minutes).padStart(2, '0'),
                s: String(seconds).padStart(2, '0')
            })
        }
        tick()
        const id = window.setInterval(tick, 1000)
        return () => window.clearInterval(id)
    }, [flashSale])

    // Banners
    const { data: mainBannersRes } = useQuery({
        queryKey: ['banners', 'main'],
        queryFn: () => bannerApi.getBanners({ position: 'main' })
    })
    const bannerImages = (mainBannersRes?.data?.data || []).map((b: any) => getImageUrl(b.image))
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
    const sliderRef = useRef<HTMLDivElement | null>(null)
    const touchStartXRef = useRef<number | null>(null)
    const touchDeltaXRef = useRef<number>(0)
    const autoSlideTimerRef = useRef<number | null>(null)

    // Auto advance banners
    useEffect(() => {
        const startAutoSlide = () => {
            stopAutoSlide()
            autoSlideTimerRef.current = window.setInterval(() => {
                setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length)
            }, 4000)
        }

        const stopAutoSlide = () => {
            if (autoSlideTimerRef.current !== null) {
                window.clearInterval(autoSlideTimerRef.current)
                autoSlideTimerRef.current = null
            }
        }

        startAutoSlide()

        // Pause on hover (desktop)
        const node = sliderRef.current
        if (node) {
            const onMouseEnter = () => stopAutoSlide()
            const onMouseLeave = () => startAutoSlide()
            node.addEventListener('mouseenter', onMouseEnter)
            node.addEventListener('mouseleave', onMouseLeave)
            return () => {
                stopAutoSlide()
                node.removeEventListener('mouseenter', onMouseEnter)
                node.removeEventListener('mouseleave', onMouseLeave)
            }
        }

        return () => {
            stopAutoSlide()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartXRef.current = e.touches[0].clientX
        touchDeltaXRef.current = 0
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartXRef.current === null) return
        const currentX = e.touches[0].clientX
        touchDeltaXRef.current = currentX - touchStartXRef.current
    }

    const handleTouchEnd = () => {
        const threshold = 50 // px
        const deltaX = touchDeltaXRef.current

        if (Math.abs(deltaX) > threshold) {
            if (deltaX < 0) {
                // swipe left -> next
                setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length)
            } else {
                // swipe right -> prev
                setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)
            }
        }

        touchStartXRef.current = null
        touchDeltaXRef.current = 0
    }


    return (
        <div id="container">
            {/* start: container heading */}
            <div className="container__heading">
                <div className="grid wide">
                    {/* start: home-banner */}
                    <div className="home-banner grid__row">
                        <div className="main-banner grid__column-8">
                            <div
                                ref={sliderRef}
                                className="main-banner__slider"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{ overflow: 'hidden', position: 'relative', borderRadius: '8px' }}
                            >
                                <div
                                    className="main-banner__track"
                                    style={{
                                        display: 'flex',
                                        width: `${Math.max(bannerImages.length,1) * 100}%`,
                                        transform: `translateX(-${bannerImages.length ? (currentBannerIndex * (100 / bannerImages.length)) : 0}%)`,
                                        transition: 'transform 0.5s ease',
                                    }}
                                >
                                    {bannerImages.length === 0 ? (
                                        <div style={{ flex: '0 0 100%' }}>
                                            <a href="#" className="main-banner__item-link">
                                                <img src="/assets/img/main-banner/banner-0.jpg" alt="Banner" className="main-banner__item-img" />
                                            </a>
                                        </div>
                                    ) : bannerImages.map((src, idx) => (
                                        <div key={idx} style={{ flex: `0 0 ${100 / bannerImages.length}%` }}>
                                            <a href="#" className="main-banner__item-link">
                                                <img src={src} alt={`Main Banner ${idx + 1}`} className="main-banner__item-img" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="main-banner__dots"
                                    style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        gap: '6px',
                                        background: 'rgba(0,0,0,0.15)',
                                        padding: '4px 8px',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {bannerImages.length > 0 && bannerImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            aria-label={`Go to slide ${idx + 1}`}
                                            onClick={() => setCurrentBannerIndex(idx)}
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: idx === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.6)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="right-banner-wrapper grid__column-4 hide-on-mobile-tablet">
                            <div className="sub-banner">
                                <a href="#" className="sub-banner__link">
                                    <img
                                        src="/assets/img/right-side-banner/banner-0.png"
                                        alt="Right Banner"
                                        className="sub-banner__img"
                                    />
                                </a>
                            </div>
                            <div className="sub-banner">
                                <a href="#" className="sub-banner__link">
                                    <img
                                        src="/assets/img/right-side-banner/banner-1.png"
                                        alt="Right Banner"
                                        className="sub-banner__img"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                    {/* end: home-banner */}

                    {/* start: suggestion category */}
                    <div className="suggestion-category">
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/sale-time.gif"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.sale_time_hunt')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/cheap.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.everything_cheap')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/freeship-xtra.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.wednesday_freeship')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/cashback.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.cashback')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/nice-price-good.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.brand_good_price')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/international-goods.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">{t('home.international_goods')}</p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/digital-product.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">
                                {t('home.digital_products')}
                            </p>
                        </a>
                        <a href="#" className="suggestion-category__item">
                            <img
                                src="/assets/img/suggestion-category/deal-1k.png"
                                alt="Icon"
                                className="suggestion-category__item-icon"
                            />
                            <p className="suggestion-category__item-content">{t('home.shock_deals')}</p>
                        </a>
                    </div>
                    {/* end: suggestion category */}
                </div>
            </div>
            {/* end: container heading */}

            {/* start: container body */}
            <div className="container__body">
                <div className="grid wide">
                    {/* start: welcome banner */}
                    <div className="welcome-banner">
                        <a href="#" className="welcome-banner__link">
                            <img
                                src="/assets/img/welcome_banner.png"
                                alt="Welcome Banner"
                                className="welcome-banner__img"
                            />
                        </a>
                    </div>
                    {/* end: welcome banner */}

                    {/* start: main category */}
                    <div className="main-category">
                        <div className="main-category__heading">{t('home.categories')}</div>
                        <div className="main-category__list">
                            {categories.map((category: Category) => (
                                <div key={category.id} className="main-category__item">
                                    <Link
                                        to={{
                                            pathname: path.search,
                                            search: createSearchParams({
                                                category: category.id.toString()
                                            }).toString()
                                        }}
                                        className="main-category__item-link"
                                    >
                                        <img
                                            src={getImageUrl(category.image || '/assets/img/no-product.png')}
                                            alt={category.name}
                                            className="main-category__img"
                                        />
                                        <div className="main-category__content">{category.name}</div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* end: main category */}

                    {/* start: flash-sale */}
                    {flashSale && (
                        <div className="flash-sale">
                            <div className="flash-sale__header">
                                <img
                                    src="/assets/img/flash-sale/flash-sale-icon.png"
                                    alt="Flash Sale"
                                    className="flash-sale__header-img"
                                />
                                <div className="flash-sale__header-countdown">
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">{remaining.h}</div>
                                    </div>
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">{remaining.m}</div>
                                    </div>
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">{remaining.s}</div>
                                    </div>
                                </div>
                                <a href="#" className="flash-sale__view-all">
                                    Xem tất cả
                                    <i className="flash-sale__view-all-icon fa-solid fa-angle-right"></i>
                                </a>
                            </div>
                            <div className="flash-sale__product grid__row">
                                {flashSale.items.slice(0, 6).map((item) => (
                                    <div className="flash-sale__item grid__column-2" key={item.id}>
                                        <Link to={`${path.productDetail}/${item.product_id}`} className="flash-sale__item-link">
                                            <div
                                                className="home-product__item-img"
                                                style={{ backgroundImage: `url(${getImageUrl(item.product_image || '') || '/assets/img/no-product.png'})` }}
                                            ></div>
                                            <p className="home-product__item-content">{item.product_name}</p>
                                            <div className="home-product__price-wrapper">
                                                <span className="home-product__item-price">₫{formatCurrency(item.sale_price)}</span>
                                                <span className="home-product__item-sold">Đã bán {formatNumberToSocialStyle(item.product_sold || 0)}</span>
                                            </div>
                                            <div className="home-product__item-favorite">
                                                <span>Đang diễn ra</span>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* end: flash-sale */}

                    {/* start: simple banner */}

                    {/* end: simple banner */}

                    {/* start: product */}
                    <div className="home-product">
                        <div className="home-product__heading">
                            {t('home.today_suggestions')}
                        </div>
                        <div className="home-product__list">
                            <div className="grid__row">
                                {products.map((product: Product) => (
                                    <Link
                                        key={product.id}
                                        to={`${path.productDetail}/${product.id}`}
                                        className="home-product__item grid__column-2"
                                    >
                                        <div
                                            className="home-product__item-img"
                                            style={{
                                                backgroundImage: `url(${getMainProductImage(product)})`
                                            }}
                                        ></div>
                                        <p className="home-product__item-content">
                                            {product.name}
                                        </p>
                                        <div className="home-product__price-wrapper">
                                            <span className="home-product__item-price">₫{formatCurrency(product.price)}</span>
                                            <span className="home-product__item-sold">{t('home.sold')} {formatNumberToSocialStyle(product.sold)}</span>
                                        </div>
                                        <div className="home-product__item-favorite">
                                            <i className="home-product__item-favorite-icon fa-solid fa-check"></i>
                                            <span>{t('home.favorite')}</span>
                                        </div>
                                        {product.price_before_discount && product.price_before_discount > product.price && (
                                            <div className="home-product__item-sale-off">
                                                <span className="home-product__item-sale-off-percent">
                                                    - {rateSale(product.price_before_discount, product.price)}
                                                </span>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                            {/* start: paginations */}
                            {productsData && (
                                <CustomPagination
                                    queryConfig={queryConfig}
                                    pageSize={pageSize}
                                />
                            )}
                            {/* end: paginations */}
                        </div>
                    </div>
                    {/* end: product */}
                </div>
            </div>
        </div>
    )
}

export default Home
