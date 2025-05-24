import { isAdmin, syncAdminRole } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const App = dynamic(() => import("./app"), { ssr: false });

export default async function AdminPage() {
  try {
    // First check if the user is an admin by email
    const isAdminByEmail = await isAdmin();
    
    if (isAdminByEmail) {
      // If the user is an admin by email, make sure their role is set correctly in the database
      await syncAdminRole();
    }
    
    // Then use requireAdmin which checks the role in the database
    await requireAdmin();
    
    return <App />;
  } catch (error) {
    console.error("Admin access error:", error);
    redirect("/unauthorized");
  }
}
