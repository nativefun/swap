"use client"

import { useEffect, useState } from 'react'
import Moralis from 'moralis'

export default function MoralisProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (!isInitialized) {
          await Moralis.start({
            apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY
          })
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Failed to initialize Moralis:', error)
      }
    }

    init()
  }, [isInitialized])

  if (!isInitialized) {
    return null
  }

  return <>{children}</>
} 