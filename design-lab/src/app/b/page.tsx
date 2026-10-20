import type { Metadata } from 'next'
import DirectionB from '@/directions/b/DirectionB'

export const metadata: Metadata = {
  title: 'B · Editorial — Roman Kucheryavyy',
}

export default function Page() {
  return <DirectionB />
}
