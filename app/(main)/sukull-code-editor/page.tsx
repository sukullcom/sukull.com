import React from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import CodeEditorClient from "./code-editor-client";

const Home = async () => {
  // Add server-side authentication check
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return <CodeEditorClient />;
};

export default Home;
