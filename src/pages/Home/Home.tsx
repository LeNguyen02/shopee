import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createSearchParams } from 'react-router-dom'
import productApi from 'src/apis/product.api'
import categoryApi from 'src/apis/category.api'
import { Product } from 'src/types/product.type'
import { Category } from 'src/types/category.type'
import { formatCurrency, formatNumberToSocialStyle, rateSale } from 'src/utils/utils'
import { getMainProductImage, getImageUrl } from 'src/utils/imageUtils'
import path from 'src/constants/path'
import useQueryConfig from 'src/hooks/useQueryConfig'

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

    return (
        <div id="container">
                {/* start: container heading */}
                <div className="container__heading">
                    <div className="grid wide">
                        {/* start: home-banner */}
                        <div className="home-banner grid__row">
                            <div className="main-banner grid__column-8">
                                <ul className="main-banner__list">
                                    <li className="main-banner__item">
                                        <a href="#" className="main-banner__item-link">
                                            <img
                                                src="/assets/img/main-banner/banner-0.jpg"
                                                alt="Main Banner"
                                                className="main-banner__item-img"
                                            />
                                        </a>
                                    </li>
                                </ul>
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
                                    khung giờ săn sale
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/cheap.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">
                                    gì cũng rẻ - mua là freeship
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/freeship-xtra.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">
                                    thứ 4 freeship - x4 Ưu đãi
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/cashback.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">
                                    hoàn xu 6% - lên đến 200K
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/nice-price-good.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">
                                    hàng hiệu giá tốt
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/international-goods.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">hàng quốc tế</p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/digital-product.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">
                                    nạp thẻ, hoá đơn & phim
                                </p>
                            </a>
                            <a href="#" className="suggestion-category__item">
                                <img
                                    src="/assets/img/suggestion-category/deal-1k.png"
                                    alt="Icon"
                                    className="suggestion-category__item-icon"
                                />
                                <p className="suggestion-category__item-content">deal sốc từ 1K</p>
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
                            <div className="main-category__heading">danh mục</div>
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
                        <div className="flash-sale">
                            <div className="flash-sale__header">
                                <img
                                    src="/assets/img/flash-sale/flash-sale-icon.png"
                                    alt="Flash Sale"
                                    className="flash-sale__header-img"
                                />
                                <div className="flash-sale__header-countdown">
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">00</div>
                                    </div>
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">00</div>
                                    </div>
                                    <div className="flash-sale__countdown-item">
                                        <div className="flash-sale__countdown-item-content">00</div>
                                    </div>
                                </div>
                                <a href="#" className="flash-sale__view-all">
                                    Xem tất cả
                                    <i className="flash-sale__view-all-icon fa-solid fa-angle-right"></i>
                                </a>
                            </div>
                            <div className="flash-sale__product grid__row">
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/selrun.png"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫79.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '90px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text"> đã bán 53 </span>
                                        </div>
                                    </a>
                                </div>
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/t-shirt.jpg"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫259.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '55px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text"> đã bán 5 </span>
                                        </div>
                                    </a>
                                </div>
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/rice-cooker.jpg"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫1.059.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '23px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text"> đã bán 3 </span>
                                        </div>
                                    </a>
                                </div>
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/case.jpg"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫1.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '120px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text">
                                                đã bán 189
                                            </span>
                                        </div>
                                    </a>
                                </div>
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/oreo.png"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫46.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '22px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text"> đã bán 16 </span>
                                        </div>
                                    </a>
                                </div>
                                <div className="flash-sale__item grid__column-2">
                                    <a href="#" className="flash-sale__item-link">
                                        <img
                                            src="/assets/img/flash-sale/cap.jpg"
                                            alt="Flash Sale"
                                            className="flash-sale__item-img"
                                        />
                                        <p className="flash-sale__item-price">₫1.000</p>
                                        <div className="flash-sale__item-progress">
                                            <div
                                                className="flash-sale__progress-state"
                                                style={{ left: '14px' }}
                                            ></div>
                                            <span className="flash-sale__progress-text"> đã bán 4 </span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        {/* end: flash-sale */}

                        {/* start: simple banner */}
                        <div className="simple-banner grid__row">
                            <img
                                src="/assets/img/simple-banner.png"
                                alt="Simple Banner"
                                className="simple-banner__img"
                            />
                            <div className="simple-banner__click-section-wrap grid__row">
                                <a
                                    href="https://google.com"
                                    target="_blank"
                                    className="simple-banner__click-section-item grid__column-4"
                                    rel="noopener noreferrer"
                                ></a>
                                <a
                                    href="https://github.com/K1ethoang"
                                    target="_blank"
                                    className="simple-banner__click-section-item grid__column-4"
                                    rel="noopener noreferrer"
                                ></a>
                                <a
                                    href="https://youtube.com"
                                    target="_blank"
                                    className="simple-banner__click-section-item grid__column-4"
                                    rel="noopener noreferrer"
                                ></a>
                            </div>
                        </div>
                        {/* end: simple banner */}

                        {/* start: product */}
                        <div className="home-product">
                            <div className="home-product__heading">
                                gợi ý hôm nay
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
                                                <span className="home-product__item-sold">Đã bán {formatNumberToSocialStyle(product.sold)}</span>
                                            </div>
                                            <div className="home-product__item-favorite">
                                                <i className="home-product__item-favorite-icon fa-solid fa-check"></i>
                                                <span>Yêu thích</span>
                                            </div>
                                            {product.price_before_discount && product.price_before_discount > product.price && (
                                                <div className="home-product__item-sale-off">
                                                    <span className="home-product__item-sale-off-percent">
                                                        {rateSale(product.price_before_discount, product.price)}%
                                                    </span>
                                                    <span className="home-product__item-sale-off-label">giảm</span>
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
