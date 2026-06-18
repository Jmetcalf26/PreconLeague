import { requirePageUser } from "@/lib/page";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requirePageUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile & settings</h1>
        <p className="mt-1 text-sm text-ink-400">
          Signed in as @{user.username}
        </p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
