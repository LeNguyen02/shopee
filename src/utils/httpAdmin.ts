import axios, { AxiosError, type AxiosInstance } from 'axios'
import HttpStatusCode from 'src/constants/httpStatusCode.enum'
import { toast } from 'react-toastify'
import { getAdminTokenFromLS } from './auth'
import config from 'src/constants/config'
import { isAxiosUnauthorizedError } from './utils'
import { ErrorResponse } from 'src/types/utils.type'

export class HttpAdmin {
  instance: AxiosInstance
  private adminToken: string
  constructor() {
    this.adminToken = getAdminTokenFromLS()
    this.instance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    this.instance.interceptors.request.use(
      (config) => {
        // Refresh token on each request
        this.adminToken = getAdminTokenFromLS()
        console.log('Admin token:', this.adminToken ? 'Present' : 'Missing')
        if (this.adminToken && config.headers) {
          config.headers.authorization = `Bearer ${this.adminToken}`
          console.log('Authorization header set:', config.headers.authorization.substring(0, 20) + '...')
          return config
        }
        console.log('No admin token found, request will fail')
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    // Add a response interceptor
    this.instance.interceptors.response.use(
      (response) => {
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

        // Handle 401 Unauthorized errors - clear session and redirect to login
        if (isAxiosUnauthorizedError<ErrorResponse<{ name: string; message: string }>>(error)) {
          this.adminToken = ''
          toast.error(error.response?.data?.message || 'Admin session expired. Please login again.')
        }
        return Promise.reject(error)
      }
    )
  }
}
const httpAdmin = new HttpAdmin().instance
export default httpAdmin
