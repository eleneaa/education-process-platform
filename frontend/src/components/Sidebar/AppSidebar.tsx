import {
  Award,
  BookOpen,
  ClipboardList,
  Compass,
  Home,
  Map,
  Trophy,
  Users,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const adminItems: Item[] = [
  { icon: Home, title: "Дашборд", path: "/" },
  { icon: Users, title: "Пользователи", path: "/admin" },
  { icon: ClipboardList, title: "Заявки", path: "/admission-requests" },
  { icon: BookOpen, title: "Программы", path: "/programs" },
  { icon: Compass, title: "Группы", path: "/groups" },
  { icon: Trophy, title: "Геймификация", path: "/gamification" },
]

const teacherItems: Item[] = [
  { icon: Home, title: "Дашборд", path: "/" },
  { icon: BookOpen, title: "Программы", path: "/programs" },
  { icon: Compass, title: "Группы", path: "/groups" },
  { icon: Trophy, title: "Геймификация", path: "/gamification" },
]

const studentItems: Item[] = [
  { icon: Home, title: "Дашборд", path: "/" },
  { icon: BookOpen, title: "Мои программы", path: "/programs" },
  { icon: Map, title: "Моя траектория", path: "/trajectory" },
  { icon: Award, title: "Достижения", path: "/gamification" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  const role = currentUser?.role?.toLowerCase()
  let items: Item[]
  if (currentUser?.is_superuser || role === "admin") {
    items = adminItems
  } else if (role === "teacher") {
    items = teacherItems
  } else {
    items = studentItems
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
