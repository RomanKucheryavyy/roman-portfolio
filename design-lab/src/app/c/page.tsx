import type { Metadata } from 'next'
import { Stage } from '@/directions/c/stage'

export const metadata: Metadata = {
  title: 'C · Stage — Roman Kucheryavyy',
}

export default function Page() {
  return <Stage />
}
