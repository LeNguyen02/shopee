import axios from 'axios'

/**
 * Vietnamese Address API Service
 * 
 * This service provides access to Vietnamese administrative divisions data
 * using the free provinces.open-api.vn API.
 * 
 * API Documentation: https://provinces.open-api.vn/
 * 
 * Features:
 * - Get all provinces/cities
 * - Get districts by province code
 * - Get wards by district code
 * - Cascading selection support
 */

export interface Province {
  code: string
  name: string
}

export interface District {
  code: string
  name: string
  province_code: string
}

export interface Ward {
  code: string
  name: string
  district_code: string
}

export interface ProvinceResponse {
  code: string
  name: string
  districts?: District[]
}

export interface DistrictResponse {
  code: string
  name: string
  province_code: string
  wards?: Ward[]
}

const addressApi = {
  // Get all provinces
  getProvinces: () => {
    return axios.get<ProvinceResponse[]>('https://provinces.open-api.vn/api/?depth=1')
  },

  // Get districts by province code
  getDistrictsByProvince: (provinceCode: string) => {
    return axios.get<ProvinceResponse>(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
  },

  // Get wards by district code
  getWardsByDistrict: (districtCode: string) => {
    return axios.get<DistrictResponse>(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
  }
}

export default addressApi
