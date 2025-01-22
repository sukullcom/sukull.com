import { getServerUser } from "./auth.server";

const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];


export const isAdmin = async () => {
  const user = await getServerUser();
  if (!user) return null;
  const userId = user.uid;

  if (!userId) {
    return false
  }

  return adminIds.includes(userId);
};
