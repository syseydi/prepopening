import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Home</h1>
      <p className="mt-2 text-slate-600">
        Welcome to PrepOpening. Train your chess openings with spaced repetition and structured journeys.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-700">Quick actions</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          <li>
            <Link
              href="/journeys"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Browse Journeys
            </Link>
          </li>
          <li>
            <Link
              href="/training"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Start Training
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Profile
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-700">Daily goal</h2>
        <p className="mt-1 text-sm text-slate-500">Complete 10 minutes and 5 moves today.</p>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 w-0 rounded-full bg-accent" />
        </div>
      </section>
    </div>
  );
}
