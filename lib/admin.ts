import { getServerUser } from "./auth";

const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",")
  : [];

export const isAdmin = async () => {
  const user = await getServerUser();
  if (!user) return null;

  const userEmail = user.email; // Access the user's email from the token
  if (!userEmail) {
    return false;
  }

  // Check if the user's email is in the list of admin emails
  return adminEmails.includes(userEmail);
};
