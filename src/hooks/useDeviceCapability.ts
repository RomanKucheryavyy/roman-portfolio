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
  const [capability, setCapability] = useState<DeviceCapability>(DEFAULTS)

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    const isLowEnd = isMobile || (navigator.hardwareConcurrency ?? 4) < 4
    setCapability({
      isMobile,
      isLowEnd,
      particleCount: isMobile ? 500 : 1500,
      enablePostProcessing: !isMobile,
    })
  }, [])

  return capability
}
