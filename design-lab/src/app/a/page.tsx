import type { Metadata } from 'next'
import { DirectionA } from '@/directions/a/direction-a'

export const metadata: Metadata = {
  title: 'A · Tactile — Roman Kucheryavyy',
}

export default function Page() {
  return <DirectionA />
}
