import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/groups")({
  component: GroupsLayout,
})

function GroupsLayout() {
  return <Outlet />
}

export default GroupsLayout
