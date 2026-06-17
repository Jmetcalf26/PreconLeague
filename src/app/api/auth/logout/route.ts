import { destroySession } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  destroySession();
  return json({ ok: true });
});
