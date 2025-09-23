import React, { useMemo, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import cartApi, { CartItem } from 'src/apis/cart.api'
import noproduct from 'src/assets/images/no-product.png'
import Button from 'src/components/Button'
import QuantityController from 'src/components/QuantityController'
import path from 'src/constants/path'
import { formatCurrency, generateNameId } from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'

import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

export default function Cart() {
  const navigate = useNavigate()
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  const { data: cartData, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart()
  })

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật giỏ hàng'
      toast.error(message)
    }
  })

  const removeCartItemMutation = useMutation({
    mutationFn: (itemId: string) => cartApi.removeCartItem(itemId),
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
    }
  })

  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
      setSelectedItems(new Set())
    }
  })

  const cartItems = cartData?.data.data.items || []
  const isAllChecked = useMemo(() => 
    cartItems.length > 0 && selectedItems.size === cartItems.length, 
    [cartItems.length, selectedItems.size]
  )
  
  const checkedItems = useMemo(() => 
    cartItems.filter(item => selectedItems.has(item.id)), 
    [cartItems, selectedItems]
  )
  
  const checkedItemsCount = checkedItems.length
  
  const totalCheckedPrice = useMemo(
    () => checkedItems.reduce((result, item) => result + item.price * item.quantity, 0),
    [checkedItems]
  )
  
  const totalCheckedSavingPrice = useMemo(
    () => checkedItems.reduce((result, item) => 
      result + (item.price_before_discount - item.price) * item.quantity, 0),
    [checkedItems]
  )

  const handleCheck = (itemId: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedItems = new Set(selectedItems)
    if (event.target.checked) {
      newSelectedItems.add(itemId)
    } else {
      newSelectedItems.delete(itemId)
    }
    setSelectedItems(newSelectedItems)
  }

  const handleCheckAll = () => {
    if (isAllChecked) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)))
    }
  }

  const handleQuantity = (itemId: string, value: number, enable: boolean) => {
    if (enable) {
      updateCartItemMutation.mutate({ itemId, quantity: value })
    }
  }

  const handleDelete = (itemId: string) => () => {
    removeCartItemMutation.mutate(itemId)
  }

  const handleDeleteManyItems = () => {
    const itemIds = checkedItems.map(item => item.id.toString())
    itemIds.forEach(itemId => {
      removeCartItemMutation.mutate(itemId)
    })
  }

  const handleBuyItems = () => {
    if (checkedItems.length > 0) {
      // Navigate to payment page with selected items
      navigate(path.payment, {
        state: {
          selectedItems: checkedItems,
          totalAmount: totalCheckedPrice
        }
      })
    }
  }

  return (
    <div className='bg-neutral-100 py-16'>
      <div className='container'>
        {cartItems.length > 0 ? (
          <>
            <div className='overflow-auto'>
              <div className='min-w-[1000px]'>
                <div className='grid grid-cols-12 rounded-sm bg-white py-5 px-9 text-2xl capitalize text-gray-500 shadow'>
                  <div className='col-span-6'>
                    <div className='flex items-center'>
                      <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                        <input
                          type='checkbox'
                          className='h-5 w-5 accent-orange'
                          checked={isAllChecked}
                          onChange={handleCheckAll}
                        />
                      </div>
                      <div className='flex-grow text-black'>Sản phẩm</div>
                    </div>
                  </div>
                  <div className='col-span-6'>
                    <div className='grid grid-cols-5 text-center'>
                      <div className='col-span-2'>Đơn giá</div>
                      <div className='col-span-1'>Số lượng</div>
                      <div className='col-span-1'>Số tiền</div>
                      <div className='col-span-1'>Thao tác</div>
                    </div>
                  </div>
                </div>
                <div className='my-3 rounded-sm bg-white p-5 shadow'>
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className='mb-5 grid grid-cols-12 items-center rounded-sm border border-gray-200 bg-white py-5 px-4 text-center text-xl text-gray-500 first:mt-0'
                    >
                      <div className='col-span-6'>
                        <div className='flex'>
                          <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                            <input
                              type='checkbox'
                              className='h-5 w-5 accent-orange'
                              checked={selectedItems.has(item.id)}
                              onChange={handleCheck(item.id)}
                            />
                          </div>
                          <div className='flex-grow'>
                            <div className='flex gap-4 ml-4'>
                              <Link
                                className='h-32 w-32 flex-shrink-0 flex justify-center items-center overflow-hidden'
                                to={`${path.home}${generateNameId({
                                  name: item.product_name,
                                  id: item.product_id.toString()
                                })}`}
                              >
                                <img alt={item.product_name} src={getImageUrl(item.product_image)} />
                              </Link>
                              <div className='flex-grow px-2 pt-1 pb-2 flex flex-col justify-center'>
                                <Link
                                  to={`${path.home}${generateNameId({
                                    name: item.product_name,
                                    id: item.product_id.toString()
                                  })}`}
                                  className='text-left line-clamp-2 text-2xl text-black'
                                >
                                  {item.product_name}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='col-span-6'>
                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-2'>
                            <div className='flex items-center justify-center'>
                              <span className='text-gray-500 line-through'>
                                ₫{formatCurrency(item.price_before_discount)}
                              </span>
                              <span className='ml-3 text-2xl text-black'>₫{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <div className='col-span-1'>
                            <QuantityController
                              max={item.product_quantity}
                              value={item.quantity}
                              classNameWrapper='flex items-center'
                              onIncrease={(value) => handleQuantity(item.id.toString(), value, value <= item.product_quantity)}
                              onDecrease={(value) => handleQuantity(item.id.toString(), value, value >= 1)}
                              onType={(value) => handleQuantity(item.id.toString(), value, value >= 1 && value <= item.product_quantity)}
                              onFocusOut={(value) =>
                                handleQuantity(
                                  item.id.toString(),
                                  value,
                                  value >= 1 &&
                                  value <= item.product_quantity &&
                                  value !== item.quantity
                                )
                              }
                              disabled={updateCartItemMutation.isPending}
                            />
                          </div>
                          <div className='col-span-1'>
                            <span className='text-orange text-3xl'>
                              ₫{formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                          <div className='col-span-1'>
                            <button
                              onClick={handleDelete(item.id.toString())}
                              className='bg-none text-black transition-colors hover:text-orange font-bold text-2xl'
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='text-2xl sticky bottom-0 z-10 mt-8 flex flex-col rounded-sm border border-gray-100 bg-white p-5 shadow sm:flex-row sm:items-center'>
              <div className='flex items-center'>
                <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                  <input
                    type='checkbox'
                    className='h-5 w-5 accent-orange'
                    checked={isAllChecked}
                    onChange={handleCheckAll}
                  />
                </div>
                <button className='mx-3 border-none bg-none' onClick={handleCheckAll}>
                  Chọn tất cả ({cartItems.length})
                </button>
                <button className='mx-3 border-none bg-none' onClick={handleDeleteManyItems}>
                  Xóa
                </button>
              </div>

              <div className='mt-5 flex flex-col sm:ml-auto sm:mt-0 sm:flex-row sm:items-center'>
                <div>
                  <div className='flex items-center sm:justify-end'>
                    <div>Tổng thanh toán ({checkedItemsCount} sản phẩm):</div>
                    <div className='ml-2 text-4xl'>₫{formatCurrency(totalCheckedPrice)}</div>
                  </div>
                  <div className='flex items-center text-3xl sm:justify-end'>
                    <div className='text-gray-500'>Tiết kiệm</div>
                    <div className='ml-6 text-orange'>₫{formatCurrency(totalCheckedSavingPrice)}</div>
                  </div>
                </div>
                <Button
                  className='mt-5 flex h-20 w-80 items-center justify-center bg-red-500 text-3xl uppercase text-white hover:bg-red-600 sm:ml-4 sm:mt-0'
                  onClick={handleBuyItems}
                  disabled={checkedItemsCount === 0}
                >
                  Mua hàng
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='text-center'>
            <img src={noproduct} alt='no purchase' className='mx-auto h-24 w-24' />
            <div className='mt-5 text-2xl font-bold text-gray-400 mb-5'>Giỏ hàng của bạn còn trống</div>
            <div className='mt-5 text-center'>
              <Link
                to={path.home}
                className='text-5xl rounded-sm bg-orange px-10 py-2  uppercase text-white transition-all hover:bg-orange/80'
              >
                Mua ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
