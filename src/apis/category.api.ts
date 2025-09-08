import http from 'src/utils/http'
import httpAdmin from 'src/utils/httpAdmin'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from 'src/types/category.type'
import { SuccessResponse } from 'src/types/utils.type'

const URL = 'categories'

const categoryApi = {
  getCategories() {
    return http.get<SuccessResponse<Category[]>>(URL)
  },
  
  getCategory(id: number) {
    return http.get<SuccessResponse<Category>>(`${URL}/${id}`)
  },
  
  createCategory(body: CreateCategoryRequest) {
    return httpAdmin.post<SuccessResponse<Category>>(URL, body)
  },
  
  updateCategory(id: number, body: UpdateCategoryRequest) {
    return httpAdmin.put<SuccessResponse<Category>>(`${URL}/${id}`, body)
  },
  
  deleteCategory(id: number) {
    return httpAdmin.delete<SuccessResponse<null>>(`${URL}/${id}`)
  }
}

export default categoryApi
