import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/page";
import { getLeague } from "@/lib/league";
import { AdminForm } from "@/components/AdminForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requirePageUser();
  if (!user.isAdmin) redirect("/");

  const league = await getLeague();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">League admin</h1>
        <p className="mt-1 text-sm text-ink-400">
          Configure the rules every deck is validated against, scoring, and
          banned cards.
        </p>
      </div>
      <AdminForm league={league} />
    </div>
  );
}
