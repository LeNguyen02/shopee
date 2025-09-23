import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import addressApi, { Province, District, Ward } from 'src/apis/address.api'

export interface AddressSelection {
  selectedProvince: string
  selectedDistrict: string
  selectedWard: string
  provinces: Province[]
  districts: District[]
  wards: Ward[]
  setSelectedProvince: (code: string) => void
  setSelectedDistrict: (code: string) => void
  setSelectedWard: (code: string) => void
  isLoadingProvinces: boolean
  isLoadingDistricts: boolean
  isLoadingWards: boolean
}

export default function useAddressSelection() {
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')

  // Fetch provinces
  const { data: provincesData, isLoading: isLoadingProvinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => addressApi.getProvinces(),
    select: (data) => data.data,
    retry: 3,
    retryDelay: 1000
  })

  // Fetch districts when province is selected
  const { data: districtsData, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ['districts', selectedProvince],
    queryFn: () => addressApi.getDistrictsByProvince(selectedProvince),
    select: (data) => data.data.districts || [],
    enabled: !!selectedProvince,
    retry: 3,
    retryDelay: 1000
  })

  // Fetch wards when district is selected
  const { data: wardsData, isLoading: isLoadingWards } = useQuery({
    queryKey: ['wards', selectedDistrict],
    queryFn: () => addressApi.getWardsByDistrict(selectedDistrict),
    select: (data) => data.data.wards || [],
    enabled: !!selectedDistrict,
    retry: 3,
    retryDelay: 1000
  })

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    if (selectedProvince) {
      setSelectedDistrict('')
      setSelectedWard('')
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedDistrict) {
      setSelectedWard('')
    }
  }, [selectedDistrict])

  const handleProvinceChange = (code: string) => {
    setSelectedProvince(code)
  }

  const handleDistrictChange = (code: string) => {
    setSelectedDistrict(code)
  }

  const handleWardChange = (code: string) => {
    setSelectedWard(code)
  }

  return {
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces: provincesData || [],
    districts: districtsData || [],
    wards: wardsData || [],
    setSelectedProvince: handleProvinceChange,
    setSelectedDistrict: handleDistrictChange,
    setSelectedWard: handleWardChange,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards
  }
}
