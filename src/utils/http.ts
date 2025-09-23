import axios, { AxiosError, type AxiosInstance } from 'axios'
import React from 'react'
import HttpStatusCode from 'src/constants/httpStatusCode.enum'
import { toast } from 'react-toastify'
import { AuthResponse } from 'src/types/auth.type'
import {
  clearLS,
  getAccessTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS
} from './auth'
import config from 'src/constants/config'
import { URL_LOGIN, URL_LOGOUT, URL_REGISTER } from 'src/apis/auth.api'
import { isAxiosUnauthorizedError } from './utils'
import path from 'src/constants/path'
import { ErrorResponse } from 'src/types/utils.type'

export class Http {
  instance: AxiosInstance
  private accessToken: string
  constructor() {
    this.accessToken = getAccessTokenFromLS()
    this.instance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = `Bearer ${this.accessToken}`
          return config
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    // Add a response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === URL_LOGIN || url === URL_REGISTER) {
          const data = response.data as AuthResponse
          this.accessToken = data.data.access_token
          setAccessTokenToLS(this.accessToken)
          setProfileToLS(data.data.user)
        } else if (url === URL_LOGOUT) {
          this.accessToken = ''
          clearLS()
        }
        return response
      },
      (error: AxiosError) => {
        // Chỉ toast lỗi không phải 422 và 401
        if (
          ![HttpStatusCode.UnprocessableEntity, HttpStatusCode.Unauthorized].includes(error.response?.status as number)
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any | undefined = error.response?.data
          const message = data?.message || error.message
          toast.error(message)
        }

        // Handle 401 Unauthorized errors
        if (isAxiosUnauthorizedError<ErrorResponse<{ name: string; message: string }>>(error)) {
          clearLS()
          this.accessToken = ''
          const serverMessage = error.response?.data?.message || ''

          // Show friendly login prompt when token is missing
          if (serverMessage === 'Access token required') {
            toast.dismiss()
            const content = React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 12 } },
              React.createElement('span', null, 'Vui lòng đăng nhập để thực hiện mua hàng.'),
              React.createElement(
                'button',
                {
                  onClick: () => {
                    window.location.assign(path.login)
                  },
                  style: {
                    backgroundColor: '#ee4d2d',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600
                  }
                },
                'Đăng nhập'
              )
            )
            toast.info(content, { autoClose: 4000 })
          } else {
            toast.error(serverMessage || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          }
        }
        return Promise.reject(error)
      }
    )
  }
}
const http = new Http().instance
export default http
