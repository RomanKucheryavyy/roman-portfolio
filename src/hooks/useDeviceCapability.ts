'use client'
import { useState, useEffect } from 'react'

interface DeviceCapability {
  isMobile: boolean
  isLowEnd: boolean
  particleCount: number
  enablePostProcessing: boolean
}

const DEFAULTS: DeviceCapability = {
  isMobile: false,
  isLowEnd: false,
  particleCount: 1500,
  enablePostProcessing: true,
}

export function useDeviceCapability(): DeviceCapability {
  const [cap, setCap] = useState<DeviceCapability>(DEFAULTS)

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches
      || window.innerWidth < 768

    // Heuristic: low-end if mobile or less than 4 logical cores
    const isLowEnd = isMobile || (navigator.hardwareConcurrency ?? 4) < 4

    setCap({
      isMobile,
      isLowEnd,
      particleCount: isMobile ? 500 : 1500,
      enablePostProcessing: !isMobile,
    })
  }, [])

  return cap
}
