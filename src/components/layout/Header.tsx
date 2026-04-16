import { RefreshButton } from "./RefreshButton";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <RefreshButton />
      </div>
    </header>
  );
}
