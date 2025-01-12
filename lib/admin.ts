import { auth } from "@clerk/nextjs/server";

const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];


export const isAdmin = () => {
  const { userId } = auth();

  if (!userId) {
    return false
  }

  return adminIds.includes(userId);
};
