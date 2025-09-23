import http from 'src/utils/http'
import httpAdmin from 'src/utils/httpAdmin'
import { SuccessResponse } from 'src/types/utils.type'

export interface Banner {
  id: number
  image: string
  link: string | null
  position: 'main' | 'right'
  sort_order: number
  is_active: 0 | 1
}

const URL = 'banners'

const bannerApi = {
  getBanners(params?: { position?: 'main' | 'right'; all?: '1' | '0' }) {
    return http.get<SuccessResponse<Banner[]>>(URL, { params })
  },
  createBanner(formData: FormData) {
    return httpAdmin.post<SuccessResponse<Banner>>(URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteBanner(id: number) {
    return httpAdmin.delete<SuccessResponse<null>>(`${URL}/${id}`)
  }
}

export default bannerApi


