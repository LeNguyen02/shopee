import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import adminApi from 'src/apis/admin.api'
import categoryApi from 'src/apis/category.api'
import { Product, CreateProductRequest, UpdateProductRequest } from 'src/types/product.type'
import { Category } from 'src/types/category.type'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import FileUpload from 'src/components/FileUpload'
import MultipleFileUpload from 'src/components/MultipleFileUpload'
import config from 'src/constants/config'

const createProductSchema = yup.object({
  name: yup.string().required('Tên sản phẩm không được để trống').min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  description: yup.string(),
  category_id: yup.number().nullable(),
  image: yup.string(),
  images: yup.array().of(yup.string()).max(10, 'Tối đa 10 hình ảnh').min(0, 'Số lượng hình ảnh không hợp lệ'),
  price: yup.number().required('Giá sản phẩm không được để trống').min(0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'),
  price_before_discount: yup.number().nullable().min(0, 'Giá trước giảm phải lớn hơn hoặc bằng 0'),
  quantity: yup.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0')
})

const updateProductSchema = yup.object({
  name: yup.string().required('Tên sản phẩm không được để trống').min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  description: yup.string(),
  category_id: yup.number().nullable(),
  image: yup.string(),
  images: yup.array().of(yup.string()).max(10, 'Tối đa 10 hình ảnh').min(0, 'Số lượng hình ảnh không hợp lệ'),
  price: yup.number().required('Giá sản phẩm không được để trống').min(0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'),
  price_before_discount: yup.number().nullable().min(0, 'Giá trước giảm phải lớn hơn hoặc bằng 0'),
  quantity: yup.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0')
})

type CreateProductFormData = yup.InferType<typeof createProductSchema>

// Helper function to get complete image URL
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '/no-product.png';
  if (imageUrl.startsWith('http')) {
    // Convert absolute URL to relative URL for proxy
    const urlObj = new URL(imageUrl);
    return urlObj.pathname;
  }
  if (imageUrl.startsWith('/uploads/')) return imageUrl;
  return imageUrl;
}
type UpdateProductFormData = yup.InferType<typeof updateProductSchema>

export default function ProductManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [currentFormType, setCurrentFormType] = useState<'create' | 'edit' | null>(null)

  const queryClient = useQueryClient()

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', currentPage, searchTerm, selectedCategory],
    queryFn: () => adminApi.getProducts({
      page: currentPage,
      limit: 10,
      search: searchTerm,
      category: selectedCategory
    })
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoryApi.getCategories()
  })

  const products = productsData?.data.data.products || []
  const pagination = productsData?.data.data.pagination
  const categories = categoriesData?.data.data || []
  

  // Create product form
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: createErrors }
  } = useForm<CreateProductFormData>({
    resolver: yupResolver(createProductSchema)
  })

  // Update product form
  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    setValue: setUpdateValue,
    watch: watchUpdate,
    formState: { errors: updateErrors }
  } = useForm<UpdateProductFormData>({
    resolver: yupResolver(updateProductSchema)
  })

  // Watch form values for debugging
  const createImageValue = watchCreate('image')
  const createImagesValue = watchCreate('images') || []
  const updateImageValue = watchUpdate('image')
  const updateImagesValue = watchUpdate('images') || []
  

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (body: CreateProductRequest) => adminApi.createProduct(body),
    onSuccess: () => {
      toast.success('Tạo sản phẩm thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setIsCreateModalOpen(false)
      resetCreate()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tạo sản phẩm thất bại')
    }
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProductRequest }) => 
      adminApi.updateProduct(id, body),
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setIsEditModalOpen(false)
      setEditingProduct(null)
      resetUpdate()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật sản phẩm thất bại')
    }
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Xóa sản phẩm thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setDeleteConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xóa sản phẩm thất bại')
    }
  })

  const handleCreateProduct = handleCreateSubmit((data) => {
    const productData = {
      ...data,
      image: uploadedImage || data.image || '',
      images: uploadedImages.length > 0 ? uploadedImages.filter(Boolean) as string[] : (data.images || []).filter(Boolean) as string[]
    }
    createProductMutation.mutate(productData)
  })

  const handleUpdateProduct = handleUpdateSubmit((data) => {
    if (editingProduct) {
      const productData = {
        ...data,
        image: uploadedImage || data.image || '',
        images: uploadedImages.length > 0 ? uploadedImages.filter(Boolean) as string[] : (data.images || []).filter(Boolean) as string[]
      }
      updateProductMutation.mutate({ id: editingProduct.id.toString(), body: productData })
    }
  })

  const handleEditClick = (product: Product) => {
    // Flatten the images array in case it's nested
    const flattenedImages = Array.isArray(product.images) 
      ? product.images.flat().filter((img): img is string => typeof img === 'string' && img.length > 0)
      : []
    
    setEditingProduct(product)
    setUploadedImage(product.image || null)
    setUploadedImages(flattenedImages)
    setCurrentFormType('edit')
    setUpdateValue('name', product.name)
    setUpdateValue('description', product.description || '')
    setUpdateValue('category_id', product.category_id || null)
    setUpdateValue('image', product.image || '')
    setUpdateValue('images', flattenedImages)
    setUpdateValue('price', product.price)
    setUpdateValue('price_before_discount', product.price_before_discount || null)
    setUpdateValue('quantity', product.quantity || 0)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteProductMutation.mutate(deleteConfirmId.toString())
    }
  }

  const handleCloseModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setEditingProduct(null)
    setDeleteConfirmId(null)
    setUploadedImage(null)
    setUploadedImages([])
    setCurrentFormType(null)
    resetCreate()
    resetUpdate()
  }

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const response = await adminApi.uploadImage(file)
      const imageUrl = response.data.data.url
      setUploadedImage(imageUrl)
      
      // Update form state with the uploaded image URL
      if (currentFormType === 'create') {
        setCreateValue('image', imageUrl)
      } else if (currentFormType === 'edit') {
        setUpdateValue('image', imageUrl)
      }
      
      toast.success('Upload hình ảnh thành công')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Lỗi upload hình ảnh')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageRemove = () => {
    setUploadedImage(null)
    
    // Clear the form input as well
    if (currentFormType === 'create') {
      setCreateValue('image', '')
    } else if (currentFormType === 'edit') {
      setUpdateValue('image', '')
    }
  }

  const handleGalleryUpload = async (files: File[]) => {
    try {
      setIsUploadingGallery(true)
      const response = await adminApi.uploadImages(files)
      const imageUrls = response.data.data.map(item => item.url)
      setUploadedImages(prev => [...prev, ...imageUrls])
      
      // Update form state with the uploaded image URLs
      if (currentFormType === 'create') {
        const currentImages = watchCreate('images') || []
        setCreateValue('images', [...currentImages, ...imageUrls])
      } else if (currentFormType === 'edit') {
        const currentImages = watchUpdate('images') || []
        setUpdateValue('images', [...currentImages, ...imageUrls])
      }
      
      toast.success(`Upload thành công ${imageUrls.length} hình ảnh`)
    } catch (error) {
      console.error('Gallery upload error:', error)
      toast.error('Lỗi upload hình ảnh gallery')
    } finally {
      setIsUploadingGallery(false)
    }
  }

  const handleGalleryRemove = () => {
    setUploadedImages([])
    
    // Clear the form input as well
    if (currentFormType === 'create') {
      setCreateValue('images', [])
    } else if (currentFormType === 'edit') {
      setUpdateValue('images', [])
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h2>
        <Button
          onClick={() => {
            setCurrentFormType('create')
            setIsCreateModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          <i className="fas fa-plus mr-2"></i>
          Thêm Sản phẩm
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm sản phẩm
            </label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <i className="fas fa-search mr-2"></i>
            Tìm kiếm
          </Button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đã bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: Product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/no-product.png'
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {product.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{formatPrice(product.price)}</div>
                    {product.price_before_discount && (
                      <div className="text-xs text-gray-500 line-through">
                        {formatPrice(product.price_before_discount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.quantity || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sold || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Chỉnh sửa"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.page_size > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.page_size, currentPage + 1))}
                disabled={currentPage === pagination.page_size}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{' '}
                  <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>
                  {' '}đến{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>
                  {' '}của{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: pagination.page_size }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.page_size, currentPage + 1))}
                    disabled={currentPage === pagination.page_size}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Thêm sản phẩm mới</h3>
                <button
                  onClick={handleCloseModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateProduct} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên sản phẩm *
                        </label>
                        <Input
                          name="name"
                          register={registerCreate}
                          placeholder="Nhập tên sản phẩm"
                          errorMessage={createErrors.name?.message}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Danh mục
                        </label>
                        <select
                          {...registerCreate('category_id')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((category: Category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {createErrors.category_id && (
                          <p className="text-red-500 text-sm mt-1">{createErrors.category_id.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        {...registerCreate('description')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Nhập mô tả chi tiết về sản phẩm"
                      />
                      {createErrors.description && (
                        <p className="text-red-500 text-sm mt-1">{createErrors.description.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Hình ảnh sản phẩm</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh chính
                    </label>
                    <FileUpload
                      onFileSelect={handleImageUpload}
                      onFileRemove={handleImageRemove}
                      currentFile={createImageValue}
                      disabled={isUploading}
                      className="mb-2"
                    />
                    {isUploading && (
                      <p className="text-sm text-blue-600">Đang upload hình ảnh...</p>
                    )}
                    <Input
                      name="image"
                      register={registerCreate}
                      placeholder="Hoặc nhập URL hình ảnh"
                      errorMessage={createErrors.image?.message}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thư viện hình ảnh (tối đa 10 hình)
                    </label>
                    <MultipleFileUpload
                      onFilesSelect={handleGalleryUpload}
                      onFilesRemove={handleGalleryRemove}
                      currentFiles={uploadedImages}
                      disabled={isUploadingGallery}
                      maxFiles={10}
                      className="mb-2"
                    />
                    {isUploadingGallery && (
                      <p className="text-sm text-blue-600">Đang upload thư viện hình ảnh...</p>
                    )}
                    {createErrors.images && (
                      <p className="text-red-500 text-sm mt-1">{createErrors.images.message}</p>
                    )}
                  </div>
                </div>

                {/* Pricing & Inventory Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Giá cả & Tồn kho</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá sản phẩm *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                        <input
                          type="number"
                          {...registerCreate('price')}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      {createErrors.price && (
                        <p className="text-red-500 text-sm mt-1">{createErrors.price.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá trước giảm
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                        <input
                          type="number"
                          {...registerCreate('price_before_discount')}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      {createErrors.price_before_discount && (
                        <p className="text-red-500 text-sm mt-1">{createErrors.price_before_discount.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        {...registerCreate('quantity')}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {createErrors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{createErrors.quantity.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createProductMutation.isPending ? 'Đang tạo...' : 'Tạo sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa sản phẩm</h3>
                <button
                  onClick={handleCloseModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên sản phẩm *
                        </label>
                        <Input
                          name="name"
                          register={registerUpdate}
                          placeholder="Nhập tên sản phẩm"
                          errorMessage={updateErrors.name?.message}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Danh mục
                        </label>
                        <select
                          {...registerUpdate('category_id')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((category: Category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {updateErrors.category_id && (
                          <p className="text-red-500 text-sm mt-1">{updateErrors.category_id.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        {...registerUpdate('description')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Nhập mô tả chi tiết về sản phẩm"
                      />
                      {updateErrors.description && (
                        <p className="text-red-500 text-sm mt-1">{updateErrors.description.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Hình ảnh sản phẩm</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh chính
                    </label>
                    <FileUpload
                      onFileSelect={handleImageUpload}
                      onFileRemove={handleImageRemove}
                      currentFile={updateImageValue}
                      disabled={isUploading}
                      className="mb-2"
                    />
                    {isUploading && (
                      <p className="text-sm text-blue-600">Đang upload hình ảnh...</p>
                    )}
                    <Input
                      name="image"
                      register={registerUpdate}
                      placeholder="Hoặc nhập URL hình ảnh"
                      errorMessage={updateErrors.image?.message}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thư viện hình ảnh (tối đa 10 hình)
                    </label>
                    <MultipleFileUpload
                      onFilesSelect={handleGalleryUpload}
                      onFilesRemove={handleGalleryRemove}
                      currentFiles={uploadedImages}
                      disabled={isUploadingGallery}
                      maxFiles={10}
                      className="mb-2"
                    />
                    {isUploadingGallery && (
                      <p className="text-sm text-blue-600">Đang upload thư viện hình ảnh...</p>
                    )}
                    {updateErrors.images && (
                      <p className="text-red-500 text-sm mt-1">{updateErrors.images.message}</p>
                    )}
                  </div>
                </div>

                {/* Pricing & Inventory Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Giá cả & Tồn kho</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá sản phẩm *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                        <input
                          type="number"
                          {...registerUpdate('price')}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      {updateErrors.price && (
                        <p className="text-red-500 text-sm mt-1">{updateErrors.price.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá trước giảm
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                        <input
                          type="number"
                          {...registerUpdate('price_before_discount')}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      {updateErrors.price_before_discount && (
                        <p className="text-red-500 text-sm mt-1">{updateErrors.price_before_discount.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        {...registerUpdate('quantity')}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {updateErrors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{updateErrors.quantity.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateProductMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteProductMutation.isPending}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteProductMutation.isPending ? 'Đang xóa...' : 'Xóa sản phẩm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
