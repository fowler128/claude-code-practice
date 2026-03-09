export function PagePlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">Phase 1 scaffold complete. Module implementation is scheduled for subsequent phases.</p>
    </section>
  );
}
