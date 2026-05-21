import { getServerUser } from "@/lib/auth";
import { isTeacher } from "@/db/queries/applications";
import { PrivateLessonNav, type PrivateLessonNavItem } from "./private-lesson-nav";

const TEACHER_ONLY: PrivateLessonNavItem[] = [
  { name: "Panelim", path: "/private-lesson/teacher-dashboard", icon: "dashboard" },
  {
    name: "Profilim",
    path: "/private-lesson/teacher-dashboard/settings",
    icon: "settings",
  },
];

const STUDENT_ITEMS: PrivateLessonNavItem[] = [
  { name: "Eğitmenler", path: "/private-lesson/teachers", icon: "users" },
  { name: "İlanlarım", path: "/private-lesson/my-listings", icon: "clipboard" },
  { name: "İlan Aç", path: "/private-lesson/listings/new", icon: "megaphone" },
];

const SHARED_ITEMS: PrivateLessonNavItem[] = [
  { name: "İlanlar", path: "/private-lesson/listings", icon: "megaphone" },
  { name: "Mesajlar", path: "/private-lesson/messages", icon: "message" },
  { name: "Paketler", path: "/private-lesson/credits", icon: "credit" },
];

function mergePrivateLessonNav(teacherMode: boolean): PrivateLessonNavItem[] {
  const seen = new Set<string>();
  const out: PrivateLessonNavItem[] = [];

  const push = (item: PrivateLessonNavItem) => {
    if (seen.has(item.path)) return;
    seen.add(item.path);
    out.push(item);
  };

  if (teacherMode) {
    for (const item of TEACHER_ONLY) push(item);
  }
  for (const item of STUDENT_ITEMS) push(item);
  for (const item of SHARED_ITEMS) push(item);

  return out;
}

/**
 * Özel ders navigasyonu — eğitmen ve öğrenci rolleri birlikteyse tek menüde birleşir.
 */
export default async function PrivateLessonHeader() {
  const user = await getServerUser();
  if (!user) return null;

  const teacherMode = await isTeacher(user.id);
  const items = mergePrivateLessonNav(teacherMode);

  return (
    <PrivateLessonNav
      items={items}
      isTeacherMode={teacherMode}
      showStudentListingHighlight
    />
  );
}
