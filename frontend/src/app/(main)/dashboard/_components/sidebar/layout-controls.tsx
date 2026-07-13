"use client";

import { Palette } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function LayoutControls() {
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({
      themeMode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );

  const onThemeModeChange = (mode: string) => {
    if (!mode) return;
    setPreference("theme_mode", mode as "light" | "dark" | "system");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon">
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <h4 className="font-medium text-sm leading-none">Theme</h4>
            <p className="text-muted-foreground text-xs">Pilih mode tampilan.</p>
          </div>
          <ToggleGroup
            size="sm"
            spacing={0}
            variant="outline"
            type="single"
            value={themeMode}
            onValueChange={onThemeModeChange}
          >
            <ToggleGroupItem value="light" aria-label="Toggle light">
              Terang
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Toggle dark">
              Gelap
            </ToggleGroupItem>
            <ToggleGroupItem value="system" aria-label="Toggle system">
              Sistem
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
