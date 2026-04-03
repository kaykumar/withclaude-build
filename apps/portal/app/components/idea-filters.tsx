"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Under Review", value: "needs-review" },
  { label: "Building", value: "building" },
  { label: "Shipped", value: "shipped" },
] as const;

export default function IdeaFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get("filter") || "";
  const currentQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentQuery);

  const updateParams = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/?${newParams.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={currentFilter}
        onValueChange={(value) => updateParams({ filter: value })}
      >
        <TabsList className="bg-muted/50">
          {FILTER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative w-full sm:w-72">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateParams({ q: e.target.value });
          }}
          className="pl-9 bg-muted/50 border-border"
        />
      </div>
      {isPending && (
        <div className="absolute inset-0 pointer-events-none" />
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
