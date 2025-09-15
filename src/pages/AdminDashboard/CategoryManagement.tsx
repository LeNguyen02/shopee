import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import categoryApi from 'src/apis/category.api'
import adminApi from 'src/apis/admin.api'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from 'src/types/category.type'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import FileUpload from 'src/components/FileUpload'

const createCategorySchema = yup.object({
  name: yup.string().required('Tên category không được để trống').min(2, 'Tên category phải có ít nhất 2 ký tự'),
  image: yup.string()
})

const updateCategorySchema = yup.object({
  name: yup.string().required('Tên category không được để trống').min(2, 'Tên category phải có ít nhất 2 ký tự'),
  image: yup.string()
})

type CreateCategoryFormData = yup.InferType<typeof createCategorySchema>
type UpdateCategoryFormData = yup.InferType<typeof updateCategorySchema>

import { getImageUrl } from 'src/utils/imageUtils'

export default function CategoryManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [currentFormType, setCurrentFormType] = useState<'create' | 'edit' | null>(null)

  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoryApi.getCategories()
  })

  const categories = categoriesData?.data.data || []

  // Create category form
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setValue: setCreateValue,
    formState: { errors: createErrors }
  } = useForm<CreateCategoryFormData>({
    resolver: yupResolver(createCategorySchema)
  })

  // Update category form
  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    setValue: setUpdateValue,
    formState: { errors: updateErrors }
  } = useForm<UpdateCategoryFormData>({
    resolver: yupResolver(updateCategorySchema)
  })

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (body: CreateCategoryRequest) => categoryApi.createCategory(body),
    onSuccess: () => {
      toast.success('Tạo category thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsCreateModalOpen(false)
      resetCreate()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tạo category thất bại')
    }
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCategoryRequest }) => 
      categoryApi.updateCategory(id, body),
    onSuccess: () => {
      toast.success('Cập nhật category thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsEditModalOpen(false)
      setEditingCategory(null)
      resetUpdate()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật category thất bại')
    }
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Xóa category thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setDeleteConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xóa category thất bại')
    }
  })

  const handleCreateCategory = handleCreateSubmit((data) => {
    createCategoryMutation.mutate(data)
  })

  const handleUpdateCategory = handleUpdateSubmit((data) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, body: data })
    }
  })

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setUpdateValue('name', category.name)
    setUpdateValue('image', category.image || '')
    setUploadedImage(category.image || null)
    setCurrentFormType('edit')
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteCategoryMutation.mutate(deleteConfirmId)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const response = await adminApi.uploadCategoryImage(file)
      const imageUrl = response.data.data.url
      setUploadedImage(imageUrl)
      
      // Update form state with the uploaded image URL
      if (currentFormType === 'create') {
        setCreateValue('image', imageUrl)
      } else if (currentFormType === 'edit') {
        setUpdateValue('image', imageUrl)
      }
      
      toast.success('Upload hình ảnh category thành công')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Lỗi upload hình ảnh category')
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

  const handleCloseModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setEditingCategory(null)
    setDeleteConfirmId(null)
    setUploadedImage(null)
    setCurrentFormType(null)
    resetCreate()
    resetUpdate()
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
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Categories</h2>
        <Button
          onClick={() => {
            setCurrentFormType('create')
            setIsCreateModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          <i className="fas fa-plus mr-2"></i>
          Thêm Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category: Category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.image ? (
                      <img
                        src={getImageUrl(category.image)}
                        alt={category.name}
                        className="h-12 w-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/no-product.png'
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <i className="fas fa-image text-gray-400"></i>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.product_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Thêm Category mới</h3>
              <form onSubmit={handleCreateCategory}>
                <Input
                  name="name"
                  register={registerCreate}
                  placeholder="Nhập tên category"
                  errorMessage={createErrors.name?.message}
                  className="mb-4"
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh category
                  </label>
                  <FileUpload
                    onFileSelect={handleImageUpload}
                    onFileRemove={handleImageRemove}
                    currentFile={uploadedImage}
                    disabled={isUploading}
                    className="mb-2"
                  />
                  {isUploading && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Đang upload...
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createCategoryMutation.isPending ? 'Đang tạo...' : 'Tạo Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Chỉnh sửa Category</h3>
              <form onSubmit={handleUpdateCategory}>
                <Input
                  name="name"
                  register={registerUpdate}
                  placeholder="Nhập tên category"
                  errorMessage={updateErrors.name?.message}
                  className="mb-4"
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh category
                  </label>
                  <FileUpload
                    onFileSelect={handleImageUpload}
                    onFileRemove={handleImageRemove}
                    currentFile={uploadedImage}
                    disabled={isUploading}
                    className="mb-2"
                  />
                  {isUploading && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Đang upload...
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateCategoryMutation.isPending}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateCategoryMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật Category'}
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
                Bạn có chắc chắn muốn xóa category này? Hành động này không thể hoàn tác.
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
                  disabled={deleteCategoryMutation.isPending}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteCategoryMutation.isPending ? 'Đang xóa...' : 'Xóa Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
