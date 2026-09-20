"use client"

import dynamic from "next/dynamic"

import { LazyOnVisible } from "@/components/site/lazy-on-visible"

/** A box the size of the demo, so the page does not jump when the demo appears. */
function DemoSkeleton() {
  return (
    <div className="bg-muted/40 min-h-[34rem] rounded-xl border p-6 motion-safe:animate-pulse">
      <p role="status" className="text-muted-foreground text-sm">
        Loading the demo…
      </p>
    </div>
  )
}

// A separate chunk, only downloaded once the visitor scrolls near the demo.
const BookingDemo = dynamic(
  () => import("@/components/site/booking-demo").then((module) => module.BookingDemo),
  { ssr: false, loading: () => <DemoSkeleton /> }
)

export function LazyBookingDemo() {
  return (
    <LazyOnVisible placeholder={<DemoSkeleton />}>
      <BookingDemo />
    </LazyOnVisible>
  )
}
