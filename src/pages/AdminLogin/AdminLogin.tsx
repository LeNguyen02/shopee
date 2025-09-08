import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponse } from 'src/types/utils.type'

const adminSchema = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không đúng định dạng'),
  password: yup
    .string()
    .required('Password là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
})

type AdminFormData = yup.InferType<typeof adminSchema>

export default function AdminLogin() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<AdminFormData>({
    resolver: yupResolver(adminSchema)
  })

  const adminLoginMutation = useMutation({
    mutationFn: (body: AdminFormData) => 
      fetch(((import.meta as any).env?.VITE_API_URL || 'http://localhost:5001') + '/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }).then(res => res.json())
  })

  const onSubmit = handleSubmit((data) => {
    setIsLoading(true)
    adminLoginMutation.mutate(data, {
      onSuccess: (data) => {
        setIsLoading(false)
        if (data.data?.access_token) {
          localStorage.setItem('admin_token', data.data.access_token)
          localStorage.setItem('admin_user', JSON.stringify(data.data.user))
          console.log('Admin token stored:', data.data.access_token.substring(0, 20) + '...')
          console.log('Admin user stored:', data.data.user)
          toast.success('Đăng nhập admin thành công')
          navigate('/admin/dashboard')
        } else {
          toast.error(data.message || 'Đăng nhập thất bại')
        }
      },
      onError: (error: unknown) => {
        setIsLoading(false)
        if (isAxiosUnprocessableEntityError<ErrorResponse<AdminFormData>>(error)) {
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              setError(key as keyof AdminFormData, {
                message: formError[key as keyof AdminFormData],
                type: 'Server'
              })
            })
          }
        } else {
          toast.error('Đăng nhập thất bại')
        }
      }
    })
  })

  return (
    <div className='bg-orange'>
      <div className='container'>
        <div className='grid grid-cols-1 py-12 lg:grid-cols-5 lg:py-32 lg:pr-10'>
          <div className='lg:col-span-2 lg:col-start-4'>
            <form className='rounded bg-white p-10 shadow-sm' onSubmit={onSubmit} noValidate>
              <div className='text-3xl font-bold text-center mb-8 text-orange-600'>
                Admin Login
              </div>
              <div className='text-lg text-center mb-8 text-gray-600'>
                Đăng nhập để quản lý hệ thống
              </div>
              
              <Input
                name='email'
                register={register}
                type='email'
                className='mt-8 text-lg'
                errorMessage={errors.email?.message}
                placeholder='Email của bạn'
              />
              
              <Input
                name='password'
                register={register}
                type='password'
                className='mt-4 text-lg'
                errorMessage={errors.password?.message}
                placeholder='Mật khẩu'
                autoComplete='on'
              />
              
              <div className='mt-6'>
                <Button
                  type='submit'
                  className='flex w-full items-center justify-center bg-red-500 px-4 py-4 text-lg font-semibold uppercase text-white hover:bg-red-600 rounded-md shadow-md border-0 min-h-[50px]'
                  isLoading={isLoading}
                  disabled={adminLoginMutation.isPending}
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập Admin'}
                </Button>
              </div>
              
              <div className='mt-8 text-center'>
                <div className='flex items-center justify-center'>
                  <span className='text-gray-500 text-base'>Quay lại trang chủ?</span>
                  <Link className='ml-2 text-orange-500 hover:text-orange-600 font-medium text-base' to='/'>
                    Trang chủ
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
