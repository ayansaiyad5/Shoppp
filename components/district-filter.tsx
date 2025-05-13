"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { STATES, ALL_DISTRICTS } from "@/lib/constants"
import { useLanguage } from "@/contexts/language-context"

export function DistrictFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStateId = searchParams.get("state")
  const currentDistrictId = searchParams.get("district")
  const { t } = useLanguage()
  const [filteredDistricts, setFilteredDistricts] = useState(ALL_DISTRICTS)

  // Filter districts based on selected state
  useEffect(() => {
    if (currentStateId) {
      setFilteredDistricts(ALL_DISTRICTS.filter(district => district.stateId === currentStateId))
    } else {
      setFilteredDistricts(ALL_DISTRICTS)
    }
  }, [currentStateId])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value || null
    const params = new URLSearchParams(searchParams.toString())
    
    if (!stateId) {
      params.delete("state")
      params.delete("district")
    } else {
      params.set("state", stateId)
      params.delete("district") // Clear district when state changes
    }
    
    router.push(`/home?${params.toString()}`)
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value || null
    const params = new URLSearchParams(searchParams.toString())

    if (!districtId) {
      params.delete("district")
    } else {
      params.set("district", districtId)
    }

    router.push(`/home?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* State selection */}
      <div>
        <label htmlFor="state-filter" className="block text-sm font-medium text-gray-700 mb-1">
          {t("selectState")}
        </label>
    <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
              <path d="M9 6a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5a.996.996 0 01.707.293l7 7z" clipRule="evenodd" />
          </svg>
          </div>
          <select
            id="state-filter"
            value={currentStateId || ""}
            onChange={handleStateChange}
            className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">{t("allLocations")}</option>
            {STATES.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* District selection - only show when state is selected */}
      {currentStateId && (
        <div>
          <label htmlFor="district-filter" className="block text-sm font-medium text-gray-700 mb-1">
            {t("selectCity")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
            </div>
            <select
              id="district-filter"
              value={currentDistrictId || ""}
              onChange={handleDistrictChange}
              className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">{t("allCitiesInState", { state: STATES.find(s => s.id === currentStateId)?.name })}</option>
              {filteredDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                {district.name}
                </option>
            ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

