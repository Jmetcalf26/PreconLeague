import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./auth";

/** Use at the top of a protected server page; redirects guests to /login. */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
