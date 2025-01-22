import { isAdmin } from "@/lib/admin";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const App = dynamic(() => import("./app"), { ssr: false });

export default async function AdminPage() {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect("/");
  }

  return <App />;
}