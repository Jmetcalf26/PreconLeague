import { requirePageUser } from "@/lib/page";
import { getLeague } from "@/lib/league";
import { getStandings } from "@/lib/queries";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  await requirePageUser();
  const [league, standings] = await Promise.all([getLeague(), getStandings()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Standings</h1>
        <p className="mt-1 text-sm text-ink-400">
          Points awarded per finish:{" "}
          {league.placementPoints
            .map((p, i) => `${i + 1}${["st", "nd", "rd"][i] ?? "th"} = ${p}`)
            .join(" · ")}
        </p>
      </div>
      <div className="card-panel">
        <StandingsTable rows={standings} />
      </div>
    </div>
  );
}
