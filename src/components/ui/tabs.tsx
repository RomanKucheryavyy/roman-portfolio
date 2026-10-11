'use client'

// shadcn's Tabs (via 21st.dev 953, @shadcn/tabs) on @radix-ui/react-tabs,
// re-skinned to this site.
//
// It is here to retire the résumé builder's hand-rolled tab bar: three plain
// buttons with no tablist, tab or tabpanel roles, no aria-selected, no arrow
// keys, and three `activeTab === …` blocks standing in for panels. Radix
// supplies the roles, the roving focus and the labelling between each tab and
// its panel. What changed from upstream: shadcn's pill-in-a-tray look and its
// ring tokens (none exist here) give way to the builder's own underline tabs,
// drawn through data-[state=active], and focus uses the site's one ring.
import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    // On a narrow phone the row scrolls sideways rather than wrapping a label
    // onto two lines. A scroller clips what overhangs it, so the triggers draw
    // the site's focus ring inset.
    className={cn('flex gap-1 overflow-x-auto border-b border-white/10', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      '-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-3 font-mono text-small text-ink-meta transition-colors hover:text-white focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-white data-[state=active]:text-white sm:px-4',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={className} {...props} />)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
