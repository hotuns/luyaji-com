"use client";

import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import type { FishingSpotOption } from "@/hooks/use-fishing-spots";

interface FishingSpotPickerProps {
  spots: FishingSpotOption[];
  value?: string;
  placeholder?: string;
  onSelect: (spot: FishingSpotOption) => void;
  onClear?: () => void;
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  triggerClassName?: string;
}

export function FishingSpotPicker({
  spots,
  value,
  placeholder = "选择钓点",
  onSelect,
  onClear,
  loading,
  error,
  onReload,
  triggerClassName,
}: FishingSpotPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return spots;
    const lowered = search.trim().toLowerCase();
    return spots.filter((spot) =>
      spot.name.toLowerCase().includes(lowered) ||
      (spot.locationName || "").toLowerCase().includes(lowered)
    );
  }, [spots, search]);

  const selected = spots.find((item) => item.id === value) || null;
  const display = selected?.name || placeholder;

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "justify-between w-full md:w-auto",
              !selected && "text-slate-400",
              triggerClassName
            )}
          >
            <span className="truncate max-w-[180px] md:max-w-[240px]">
              {display}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              {selected ? selected.visibility === "public" ? "公开" : selected.visibility === "friends" ? "仅好友" : "私密" : ""}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command className="border-none">
            <CommandInput
              placeholder="搜索钓点或地点"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-64">
              {loading ? (
                <div className="py-6 flex items-center justify-center text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载中...
                </div>
              ) : error ? (
                <CommandEmpty>
                  <div className="space-y-2 py-4">
                    <p className="text-sm text-red-500">{error}</p>
                    {onReload && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onReload();
                          setSearch("");
                        }}
                      >
                        重试
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>没有匹配的钓点</CommandEmpty>
                  <CommandGroup>
                    {filtered.map((spot) => (
                      <CommandItem
                        key={spot.id}
                        value={spot.id}
                        onSelect={() => {
                          onSelect(spot);
                          setSearch("");
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected?.id === spot.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-slate-900">
                            {spot.name}
                            <span className="ml-2 text-xs text-slate-400">
                              {spot.visibility === "public"
                                ? "公开"
                                : spot.visibility === "friends"
                                ? "仅好友"
                                : "私密"}
                            </span>
                          </span>
                          {spot.locationName && (
                            <span className="text-xs text-slate-500">
                              {spot.locationName}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && onClear && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          清除
        </Button>
      )}
    </div>
  );
}
