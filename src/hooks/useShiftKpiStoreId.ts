import { useEffect, useState } from 'react'
import * as krikApi from '../api/krikApi'
import { useAuth } from '../auth/AuthContext'
import type { StoreRow } from '../types/api'

/** Chọn cửa hàng cho module Công & KPI: ưu tiên store của user, không thì CH đầu danh sách. */
export function useShiftKpiStoreId() {
  const { user } = useAuth()
  const [stores, setStores] = useState<StoreRow[]>([])
  const [storeId, setStoreId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await krikApi.fetchStores()
        if (cancelled) return
        setStores(list)
        setStoreId((prev) => {
          if (prev) return prev
          if (user?.storeId) return user.storeId
          return list[0]?.id ?? null
        })
      } catch {
        if (!cancelled) setStores([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.storeId])

  return { stores, storeId, setStoreId }
}
