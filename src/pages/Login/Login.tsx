import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import { schema, Schema } from 'src/utils/rules'
import { useMutation } from '@tanstack/react-query'
import authApi from 'src/apis/auth.api'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponse } from 'src/types/utils.type'
import Input from 'src/components/Input'
import { useContext } from 'react'
import { AppContext } from 'src/contexts/app.context'
import Button from 'src/components/Button'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

type FormData = Pick<Schema, 'email' | 'password'>
const loginSchema = schema.pick(['email', 'password'])

export default function Login() {
  const { t } = useTranslation('home')
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const {
    register,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(loginSchema)
  })

  const loginMutation = useMutation({
    mutationFn: (body: Omit<FormData, 'confirm_password'>) => authApi.login(body)
  })
  const onSubmit = handleSubmit((data) => {
    loginMutation.mutate(data, {
      onSuccess: (data) => {
        setIsAuthenticated(true)
        setProfile(data.data.data.user)
        navigate('/')
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponse<FormData>>(error)) {
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              setError(key as keyof FormData, {
                message: formError[key as keyof FormData],
                type: 'Server'
              })
            })
          }
        }
      }
    })
  })

  return (
    <div className='bg-orange'>
      <Helmet>
        <title>{t('auth.login')} | Shopee Clone</title>
        <meta name='description' content={t('auth.login') + ' vào dự án Shopee Clone'} />
      </Helmet>
      <div className='container mx-auto px-4'>
        <div className='flex justify-center items-center min-h-screen py-8'>
          <div className='w-[90%] sm:w-[520px] max-w-[520px]'>
            <form className='rounded-lg bg-white p-10 sm:p-16 shadow-lg border min-h-[520px] flex flex-col justify-center' onSubmit={onSubmit} noValidate>
              <div className='text-3xl font-bold text-center mb-8 sm:mb-10 text-gray-800'>{t('auth.login')}</div>
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
              <div className='mt-6 sm:mt-10'>
                <Button
                  type='submit'
                  className='flex w-full items-center justify-center bg-red-500 py-4 sm:py-5 px-4 text-lg font-semibold uppercase text-white hover:bg-red-600 rounded-md shadow-md transition-colors duration-200'
                  isLoading={loginMutation.isPending}
                  disabled={loginMutation.isPending}
                >
                  {t('auth.login')}
                </Button>
              </div>
              <div className='mt-8 sm:mt-12 text-center'>
                <span className='text-gray-600 text-lg'>{t('auth.dont_have_account')}</span>
                <Link className='ml-2 text-red-500 hover:text-red-600 font-semibold text-lg transition-colors duration-200' to='/register'>
                  {t('auth.register')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
