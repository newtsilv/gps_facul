"use client";

import { Building2Icon, ChevronDownIcon } from "lucide-react";
import { useNavigationStore } from "@/store/navigation";
import { sites } from "./sites";

/** Escolha do local mapeado (Oxygeni Hub, campus demo...). */
export function SiteSwitcher() {
  const siteId = useNavigationStore((state) => state.siteId);
  const setSite = useNavigationStore((state) => state.setSite);

  return (
    <label className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50/95 py-1.5 pr-2 pl-2.5 text-sm font-medium shadow-md backdrop-blur-md transition-colors hover:border-primary-300">
      <Building2Icon className="size-4 text-primary-500" />
      <span className="sr-only">Local</span>
      <select
        value={siteId}
        onChange={(event) => setSite(event.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-4 text-primary-300" />
    </label>
  );
}
