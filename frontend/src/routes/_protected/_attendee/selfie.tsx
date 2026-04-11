import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/_attendee/selfie')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_attendee/selfie"!</div>
}
