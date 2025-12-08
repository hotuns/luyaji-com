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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { X, Check, Loader2, Plus } from "lucide-react";

import { useMetadataOptions } from "@/hooks/use-metadata-options";
import type { MetadataCategory, MetadataOption } from "@/lib/metadata";
import { cn } from "@workspace/ui/lib/utils";

type MetadataSuggestionProps = {
  category: MetadataCategory;
  description?: string;
  selectedMetadataId?: string | null;
  selectedLabel?: string | null;
  onSelect: (option: MetadataOption) => void;
  onClear?: () => void;
  triggerLabel?: string;
};

export function MetadataSuggestion({
  category,
  description,
  selectedMetadataId,
  selectedLabel,
  onSelect,
  onClear,
  triggerLabel = "选择常用选项",
}: MetadataSuggestionProps) {
  const { options, loading, error, reload } = useMetadataOptions(category);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const lowered = search.trim().toLowerCase();
    return options.filter((item) =>
      (item.label || item.value).toLowerCase().includes(lowered)
    );
  }, [options, search]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      {selectedMetadataId && selectedLabel && (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1"
        >
          标准：{selectedLabel}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="ml-1 text-blue-400 hover:text-blue-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      )}
      <Popover open={open} onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command className="border-none">
            <CommandInput
              placeholder="搜索..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-56">
              {loading ? (
                <div className="py-6 flex items-center justify-center text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  载入中...
                </div>
              ) : error ? (
                <CommandEmpty>
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">{error}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={reload}
                      className="text-xs"
                    >
                      重试
                    </Button>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>未找到匹配的选项</CommandEmpty>
                  <CommandGroup>
                    {filtered.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.label || item.value}
                        onSelect={() => {
                          onSelect(item);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMetadataId === item.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="text-sm">
                          {item.label || item.value}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            {description && (
              <div className="border-t px-3 py-2 text-[11px] text-slate-400">
                {description}
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type MetadataSelectProps = {
  options: MetadataOption[]
  value?: string | null
  valueLabel?: string | null
  placeholder?: string
  disabled?: boolean
  onSelect: (option: MetadataOption) => void
}

export function MetadataSelect({
  options,
  value,
  valueLabel,
  placeholder = "请选择",
  disabled,
  onSelect,
}: MetadataSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const lowered = search.trim().toLowerCase()
    return options.filter((item) =>
      (item.label || item.value).toLowerCase().includes(lowered)
    )
  }, [options, search])

  const selectedOption = options.find((item) => item.id === value)
  const displayText =
    selectedOption?.label ||
    selectedOption?.value ||
    valueLabel ||
    ""

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayText || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="搜索..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60">
            <CommandEmpty>暂无匹配项</CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label || item.value}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label || item.value}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type MetadataTagSelectorProps = {
  category: MetadataCategory;
  selectedIds: string[];
  customTags: string[];
  onMetadataToggle: (option: MetadataOption) => void;
  onAddCustom: (label: string) => void;
  onRemoveCustom: (label: string) => void;
  placeholder?: string;
};

export function MetadataTagSelector({
  category,
  selectedIds,
  customTags,
  onMetadataToggle,
  onAddCustom,
  onRemoveCustom,
  placeholder = "输入自定义标签并回车",
}: MetadataTagSelectorProps) {
  const { options, loading, error, reload } = useMetadataOptions(category);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const lowered = search.trim().toLowerCase();
    return options.filter((item) =>
      (item.label || item.value).toLowerCase().includes(lowered)
    );
  }, [options, search]);

  const handleAddCustom = () => {
    const label = customInput.trim();
    if (!label) return;
    onAddCustom(label);
    setCustomInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedIds.length === 0 &&
          customTags.length === 0 && (
            <p className="text-xs text-slate-400">
              还没有添加场景标签
            </p>
          )}
        {selectedIds.map((id) => {
          const item = options.find((opt) => opt.id === id);
          return (
            <Badge
              key={id}
              variant="secondary"
              className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1"
            >
              {item?.label || item?.value || "未知"}
              <button
                type="button"
                className="text-blue-400 hover:text-blue-600"
                onClick={() => {
                  if (item) onMetadataToggle(item);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}
        {customTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="flex items-center gap-1 border-dashed"
          >
            {tag}
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => onRemoveCustom(tag)}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Popover open={open} onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              选择推荐标签
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0">
            <Command className="border-none">
              <CommandInput
                placeholder="搜索场景标签..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-60">
                {loading ? (
                  <div className="py-6 flex items-center justify-center text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    载入中...
                  </div>
                ) : error ? (
                  <CommandEmpty>
                    <div className="space-y-2">
                      <p className="text-sm text-red-500">{error}</p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={reload}
                        className="text-xs"
                      >
                        重试
                      </Button>
                    </div>
                  </CommandEmpty>
                ) : (
                  <>
                    <CommandEmpty>未找到匹配的标签</CommandEmpty>
                    <CommandGroup>
                      {filtered.map((item) => {
                        const checked = selectedIds.includes(item.id);
                        return (
                          <CommandItem
                            key={item.id}
                            onSelect={() => {
                              onMetadataToggle(item);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                checked ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.label || item.value}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={!customInput.trim()}
            onClick={handleAddCustom}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
