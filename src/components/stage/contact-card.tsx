'use client'

import type { ComponentProps } from 'react'
import ContactWithGlobe from '@/components/ui/contact-with-globe'
import { Composer } from './composer'

/**
 * The contact card with Tactile's message box (composer.tsx) in place of its
 * own form, as one module, so the box and its two kokonut parts load with
 * the card after the page (stage.tsx loads this with next/dynamic) rather
 * than in the page's first JavaScript. The box only ever shows inside the
 * card, so nothing waits on it that didn't already.
 */
export default function ContactCard(props: Omit<ComponentProps<typeof ContactWithGlobe>, 'form'>) {
  return <ContactWithGlobe {...props} form={<Composer />} />
}
