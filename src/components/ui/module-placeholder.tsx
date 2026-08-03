import type { LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center dark:border-neutral-700 dark:bg-neutral-950">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30">
        <Icon size={22} />
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-brand-600">
        Scheduled for a later build phase
      </p>
    </div>
  );
}
