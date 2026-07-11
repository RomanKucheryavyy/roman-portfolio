'use client'
import { useState } from 'react'

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

/**
 * Synchronous initialization — the page gates rendering behind a mounted
 * check, so window exists on first client render. A post-mount effect here
 * used to flash the desktop deck (and download the desktop-only modal) on
 * every phone visit before correcting itself.
 */
export function useDeviceCapability(): DeviceCapability {
  const [capability] = useState<DeviceCapability>(() => {
    if (typeof window === 'undefined') return DEFAULTS
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    return {
      isMobile,
      isLowEnd: isMobile || (navigator.hardwareConcurrency ?? 4) < 4,
      particleCount: isMobile ? 500 : 1500,
      enablePostProcessing: !isMobile,
    }
  })

  return capability
}
