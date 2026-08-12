export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-950">Authenticated dashboard foundation</h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          Module 1 protects this route and keeps auth cookies refreshed. Inventory, chat, and recipe panels will be composed here in later modules.
        </p>
      </div>
    </section>
  );
}
