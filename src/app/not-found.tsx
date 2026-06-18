import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card-panel mx-auto max-w-md p-8 py-12 text-center">
      <p className="wordart text-7xl font-bold">404</p>
      <h1 className="mt-4 animate-glow text-2xl">Thou Hast Wandered Off the Map!</h1>
      <p className="mt-3 text-sm text-ink-300">
        That deck, player, or scroll doth not exist in these lands. 🗺️
      </p>
      <p className="mt-2 animate-blink text-xs font-bold text-[#ff4dff]">
        ✦ ERROR 404 ✦ ERROR 404 ✦
      </p>
      <Link href="/" className="btn-primary mt-6">
        ⌂ Return to ye Home Page
      </Link>
    </div>
  );
}
