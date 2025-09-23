import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation } from '@tanstack/react-query'
// Không có tính năng tree-shaking
// import { omit } from 'lodash'

// Import chỉ mỗi function omit
import omit from 'lodash/omit'

import { schema, Schema } from 'src/utils/rules'
import Input from 'src/components/Input'
import authApi from 'src/apis/auth.api'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponse } from 'src/types/utils.type'
import { useContext } from 'react'
import { AppContext } from 'src/contexts/app.context'
import Button from 'src/components/Button'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

type FormData = Pick<Schema, 'email' | 'password' | 'confirm_password'>
const registerSchema = schema.pick(['email', 'password', 'confirm_password'])

export default function Register() {
  const { t } = useTranslation('home')
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(registerSchema)
  })
  const registerAccountMutation = useMutation({
    mutationFn: (body: Omit<FormData, 'confirm_password'>) => authApi.registerAccount(body)
  })
  const onSubmit = handleSubmit((data) => {
    const body = omit(data, ['confirm_password'])
    registerAccountMutation.mutate(body, {
      onSuccess: (data) => {
        setIsAuthenticated(true)
        setProfile(data.data.data.user)
        navigate('/')
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponse<Omit<FormData, 'confirm_password'>>>(error)) {
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              setError(key as keyof Omit<FormData, 'confirm_password'>, {
                message: formError[key as keyof Omit<FormData, 'confirm_password'>],
                type: 'Server'
              })
            })
          }
          // if (formError?.email) {
          //   setError('email', {
          //     message: formError.email,
          //     type: 'Server'
          //   })
          // }
          // if (formError?.password) {
          //   setError('password', {
          //     message: formError.password,
          //     type: 'Server'
          //   })
          // }
        }
      }
    })
  })

  return (
    <div className='bg-orange'>
      <Helmet>
        <title>{t('auth.register')} | Shopee Clone</title>
        <meta name='description' content={t('auth.register') + ' tài khoản vào dự án Shopee Clone'} />
      </Helmet>
      <div className='container mx-auto px-4'>
        <div className='flex justify-center items-center min-h-screen py-8'>
          <div className='w-[90%] sm:w-[520px] max-w-[520px]'>
            <form className='rounded-lg bg-white p-10 sm:p-16 shadow-lg border min-h-[580px] flex flex-col justify-center' onSubmit={onSubmit} noValidate>
              <div className='text-3xl font-bold text-center mb-8 sm:mb-10 text-gray-800'>{t('auth.register')}</div>
              <Input
                name='email'
                register={register}
                type='email'
                className='mt-6 sm:mt-8'
                errorMessage={errors.email?.message}
                placeholder={t('auth.email')}
                style={{ fontSize: '16px', padding: '14px' }}
              />
              <Input
                name='password'
                register={register}
                type='password'
                className='mt-4 sm:mt-6'
                classNameEye='absolute right-[8px] h-6 w-6 cursor-pointer top-[16px]'
                errorMessage={errors.password?.message}
                placeholder={t('auth.password')}
                autoComplete='on'
                style={{ fontSize: '16px', padding: '14px' }}
              />

              <Input
                name='confirm_password'
                register={register}
                type='password'
                className='mt-4 sm:mt-6'
                classNameEye='absolute right-[8px] h-6 w-6 cursor-pointer top-[16px]'
                errorMessage={errors.confirm_password?.message}
                placeholder={t('auth.confirm_password')}
                autoComplete='on'
                style={{ fontSize: '16px', padding: '14px' }}
              />

              <div className='mt-6 sm:mt-10'>
                <Button
                  className='flex w-full items-center justify-center bg-red-500 py-4 sm:py-5 px-4 text-lg font-semibold uppercase text-white hover:bg-red-600 rounded-md shadow-md transition-colors duration-200'
                  isLoading={registerAccountMutation.isPending}
                  disabled={registerAccountMutation.isPending}
                >
                  {t('auth.register')}
                </Button>
              </div>
              <div className='mt-8 sm:mt-12 text-center'>
                <span className='text-gray-600 text-lg'>{t('auth.already_have_account')}</span>
                <Link className='ml-2 text-red-500 hover:text-red-600 font-semibold text-lg transition-colors duration-200' to='/login'>
                  {t('auth.login')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
