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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  { icon: BookOpen, title: "Мои программы", path: "/my-programs" },
  { icon: Map, title: "Траектория", path: "/trajectory" },
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
