import type { Dispatch, ReactNode, SetStateAction } from 'react'

export type AppOutletContextValue = {
  setHeaderActions: Dispatch<SetStateAction<ReactNode>>
}
