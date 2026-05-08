import { getServerUser } from "@/lib/auth";
import { isTeacher } from "@/db/queries/applications";
import { PrivateLessonNav, type PrivateLessonNavItem } from "./private-lesson-nav";

/**
 * Server-rendered navigator for the private-lesson area.
 *
 * Eğitmen erişimi (`users.role === 'teacher'` veya onaylı başvuru) hangi
 * sekme setinin gösterileceğini belirler:
 *
 * Active highlighting is delegated to a client child so the top-level
 * can stay server-side and avoid flashing a loading state while the
 * client resolves the active link from the pathname.
 */
export default async function PrivateLessonHeader() {
  const user = await getServerUser();
  if (!user) return null;

  const teacherMode = await isTeacher(user.id);

  const teacherItems: PrivateLessonNavItem[] = [
    { name: "Panelim", path: "/private-lesson/teacher-dashboard", icon: "dashboard" },
    { name: "Profilim", path: "/private-lesson/teacher-dashboard/settings", icon: "settings" },
    { name: "İlanlar", path: "/private-lesson/listings", icon: "megaphone" },
    { name: "Mesajlar", path: "/private-lesson/messages", icon: "message" },
    { name: "Paketler", path: "/private-lesson/credits", icon: "credit" },
  ];

  const studentItems: PrivateLessonNavItem[] = [
    { name: "Eğitmenler", path: "/private-lesson/teachers", icon: "users" },
    { name: "İlanlarım", path: "/private-lesson/my-listings", icon: "clipboard" },
    { name: "İlan Aç", path: "/private-lesson/listings/new", icon: "megaphone" },
    { name: "Mesajlar", path: "/private-lesson/messages", icon: "message" },
    { name: "Paketler", path: "/private-lesson/credits", icon: "credit" },
  ];

  const items = teacherMode ? teacherItems : studentItems;
  return <PrivateLessonNav items={items} isTeacherMode={teacherMode} />;
}
