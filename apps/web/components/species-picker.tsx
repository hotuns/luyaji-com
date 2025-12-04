"use client";

import { useState, useEffect } from "react";
import { FishSpecies } from "@/lib/types";
import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { Check, ChevronsUpDown, ChevronLeft } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface SpeciesPickerProps {
  value: FishSpecies | null;
  onSelect: (species: FishSpecies) => void;
  placeholder?: string;
  /** 外部传入鱼种列表（可选，不传则组件自行获取） */
  speciesList?: FishSpecies[];
  /** 外部传入加载状态（可选） */
  loading?: boolean;
}

export function SpeciesPicker({ 
  value, 
  onSelect, 
  placeholder = "选择鱼种...",
  speciesList: externalSpeciesList,
  loading: externalLoading,
}: SpeciesPickerProps) {
  const [internalSpecies, setInternalSpecies] = useState<FishSpecies[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [open, setOpen] = useState(false);

  // 使用外部数据或内部数据
  const species = externalSpeciesList ?? internalSpecies;
  const loading = externalLoading ?? internalLoading;

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 获取鱼种列表（仅当未提供外部数据时）
  useEffect(() => {
    if (externalSpeciesList !== undefined) {
      return; // 使用外部数据，不需要获取
    }
    fetch("/api/fish-species")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInternalSpecies(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setInternalLoading(false));
  }, [externalSpeciesList]);

  const handleSelect = (s: FishSpecies) => {
    onSelect(s);
    setShowMobileSearch(false);
    setOpen(false);
  };

  // 移动端：全屏搜索弹窗
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowMobileSearch(true)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-left flex items-center justify-between"
        >
          {value ? (
            <span className="text-slate-900">{value.name}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 text-slate-400" />
        </button>

        {showMobileSearch && (
          <MobileSpeciesSearch
            species={species}
            loading={loading}
            value={value}
            onClose={() => setShowMobileSearch(false)}
            onSelect={handleSelect}
          />
        )}
      </>
    );
  }

  // PC端：下拉搜索选择器
  return (
    <DesktopSpeciesCombobox
      species={species}
      loading={loading}
      value={value}
      open={open}
      onOpenChange={setOpen}
      onSelect={handleSelect}
      placeholder={placeholder}
    />
  );
}

// 移动端全屏搜索组件
function MobileSpeciesSearch({
  species,
  loading,
  value,
  onClose,
  onSelect,
}: {
  species: FishSpecies[];
  loading: boolean;
  value: FishSpecies | null;
  onClose: () => void;
  onSelect: (species: FishSpecies) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpecies = species.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 搜索头部 */}
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-600 -ml-1 p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索鱼种..."
            className="flex-1 px-4 py-2 bg-slate-100 rounded-full outline-none text-base"
            autoFocus
          />
        </div>
      </div>

      {/* 鱼种列表 */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSpecies.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3",
                  value?.id === s.id && "bg-blue-50"
                )}
              >
                <span className="text-2xl">🐟</span>
                <span className="font-medium text-slate-900 flex-1">{s.name}</span>
                {value?.id === s.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
            {filteredSpecies.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                没有找到匹配的鱼种
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// PC端下拉搜索组件
function DesktopSpeciesCombobox({
  species,
  loading,
  value,
  open,
  onOpenChange,
  onSelect,
  placeholder,
}: {
  species: FishSpecies[];
  loading: boolean;
  value: FishSpecies | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (species: FishSpecies) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");

  const filteredSpecies = species.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-12 text-base"
        >
          {value ? (
            <span className="flex items-center gap-2">
              <span>🐟</span>
              {value.name}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="搜索鱼种..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-slate-500">
                加载中...
              </div>
            ) : (
              <>
                <CommandEmpty>未找到匹配的鱼种</CommandEmpty>
                <CommandGroup>
                  {filteredSpecies.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => {
                        onSelect(s);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.id === s.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="mr-2">🐟</span>
                      {s.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
