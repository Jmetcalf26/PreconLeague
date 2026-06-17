import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-6xl font-bold text-brand-500">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-ink-400">
        That deck, player, or page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
