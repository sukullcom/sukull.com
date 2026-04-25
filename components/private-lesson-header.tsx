import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PrivateLessonNav, type PrivateLessonNavItem } from "./private-lesson-nav";

/**
 * Server-rendered navigator for the private-lesson area.
 *
 * Role determines which tab set is shown:
 *   - teacher  -> dashboard, open listings (offer flow), messages, credits
 *   - student / guest -> teachers directory, my listings, new listing,
 *     messages, credits
 *
 * Active highlighting is delegated to a client child so the top-level
 * can stay server-side and avoid flashing a loading state while the
 * role is being discovered.
 */
export default async function PrivateLessonHeader() {
  const user = await getServerUser();
  if (!user) return null;

  const row = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  const role = row?.role ?? "user";

  const teacherItems: PrivateLessonNavItem[] = [
    { name: "Panelim", path: "/private-lesson/teacher-dashboard", icon: "dashboard" },
    { name: "İlanlar", path: "/private-lesson/listings", icon: "megaphone" },
    { name: "Mesajlar", path: "/private-lesson/messages", icon: "message" },
    { name: "Kredi", path: "/private-lesson/credits", icon: "credit" },
  ];

  const studentItems: PrivateLessonNavItem[] = [
    { name: "Öğretmenler", path: "/private-lesson/teachers", icon: "users" },
    { name: "İlanlarım", path: "/private-lesson/my-listings", icon: "clipboard" },
    { name: "İlan Aç", path: "/private-lesson/listings/new", icon: "megaphone" },
    { name: "Mesajlar", path: "/private-lesson/messages", icon: "message" },
    { name: "Kredi", path: "/private-lesson/credits", icon: "credit" },
  ];

  const items = role === "teacher" ? teacherItems : studentItems;
  return <PrivateLessonNav items={items} />;
}
