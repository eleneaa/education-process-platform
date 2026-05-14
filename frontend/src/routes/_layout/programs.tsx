import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/programs")({
  component: ProgramsLayout,
})

function ProgramsLayout() {
  return <Outlet />
}
