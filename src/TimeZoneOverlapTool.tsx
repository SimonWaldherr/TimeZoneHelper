import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { X, ChevronsUpDown, Clock } from "lucide-react";

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

type Lang = "de" | "en";

type Dictionary = Record<string, string>;

const MESSAGES: Record<Lang, Dictionary> = {
  de: {
    title: "Zeitzonen-Überlappung",
    subtitle:
      "Deine Zeitzone ist beim Öffnen vorausgewählt. Wähle darunter weitere Zeitzonen – nach jeder Auswahl erscheint automatisch ein neues Feld.",

    language: "Sprache",

    timeZonesCardTitle: "Zeitzonen",
    yourTzLocked: "Deine Zeitzone ist vorausgewählt und kann nicht geändert werden.",

    tzPlaceholderFirst: "Weitere Zeitzone wählen…",
    tzPlaceholderMore: "Noch eine Zeitzone…",

    searchPlaceholder: "Suchen… (z.B. Berlin, Tokyo, New_York)",
    noTzFound: "Keine Zeitzone gefunden.",
    alreadyChosen: "schon gewählt",

    emptyHint: "Leeres Feld = neues Auswahlfeld bleibt verfügbar.",
    removeZone: "Zeitzone entfernen",

    windowTitle: "Überlappungs-Fenster",
    windowHint:
      "Dieses Zeitfenster wird in jeder ausgewählten Zeitzone als „verfügbar“ interpretiert. Die Tabelle zeigt, wann diese lokalen Fenster sich überschneiden.",

    start: "Start",
    end: "Ende",

    todayOverlap: "Heutige Überschneidung (in deiner Zeitzone)",
    noOverlap: "Keine gemeinsame Zeit gefunden",
    base: "Basis",
    date: "Datum",

    gridTitle: "Überschneidung im Tagesverlauf (Stundenraster)",
    needAtLeastOne: "Wähle mindestens eine weitere Zeitzone aus, um Überschneidungen zu sehen.",

    yourTime: "Deine Zeit",
    now: "Jetzt",

    overlap: "Overlap",
    inWindow: "im Fenster",
    outside: "außerhalb",

    tip:
      "Tipp: Wenn du viele Zeitzonen hinzufügst, kannst du horizontal scrollen. „Overlap“ markiert Stunden (in deiner Zeitzone), in denen alle ausgewählten Zeitzonen gleichzeitig im lokalen Fenster liegen.",

    ariaAddedRow: "Neues Zeitzonenfeld hinzugefügt.",
    ariaRemovedRow: "Zeitzone entfernt.",

    tableCaption:
      "Stundenraster in deiner Zeitzone mit umgerechneten Zeiten in allen ausgewählten Zeitzonen. Markiert sind gemeinsame Überschneidungen.",

    rangeLegend: "Zeitfenster",
    startRange: "Startstunde",
    endRange: "Endstunde",
  },
  en: {
    title: "Time Zone Overlap",
    subtitle:
      "Your local time zone is preselected. Pick additional time zones below — every selection automatically adds another empty selector.",

    language: "Language",

    timeZonesCardTitle: "Time zones",
    yourTzLocked: "Your time zone is preselected and cannot be changed.",

    tzPlaceholderFirst: "Select another time zone…",
    tzPlaceholderMore: "Add one more time zone…",

    searchPlaceholder: "Search… (e.g. Berlin, Tokyo, New_York)",
    noTzFound: "No time zone found.",
    alreadyChosen: "already selected",

    emptyHint: "An empty field keeps the next selector available.",
    removeZone: "Remove time zone",

    windowTitle: "Availability window",
    windowHint:
      "This window is interpreted as “available” in each selected time zone. The table shows when these local windows overlap.",

    start: "Start",
    end: "End",

    todayOverlap: "Today's overlap (in your time zone)",
    noOverlap: "No common time found",
    base: "Base",
    date: "Date",

    gridTitle: "Overlap across the day (hour grid)",
    needAtLeastOne: "Select at least one additional time zone to see overlaps.",

    yourTime: "Your time",
    now: "Now",

    overlap: "Overlap",
    inWindow: "in window",
    outside: "outside",

    tip:
      "Tip: If you add many time zones, you can scroll horizontally. “Overlap” marks hours (in your time zone) where all selected time zones are inside the local window at the same time.",

    ariaAddedRow: "Added another time zone selector.",
    ariaRemovedRow: "Removed time zone.",

    tableCaption:
      "Hour grid in your time zone with converted times for all selected time zones. Shared overlaps are highlighted.",

    rangeLegend: "Time window",
    startRange: "Start hour",
    endRange: "End hour",
  },
};

function t(lang: Lang, key: string): string {
  return MESSAGES[lang][key] ?? key;
}

function safeSupportedTimeZones(): string[] {
  // Modern browsers (Chromium/Firefox/Safari newer) support this.
  // Fallback list keeps the tool usable even without supportedValuesOf.
  // @ts-ignore
  if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
    // @ts-ignore
    return Intl.supportedValuesOf("timeZone") as string[];
  }
  return [
    "Europe/Berlin",
    "Europe/London",
    "Europe/Paris",
    "Europe/Warsaw",
    "Europe/Istanbul",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
}

function getParts(date: Date, timeZone: string, locale: string): Parts {
  // Use latin digits for parsing, but keep localized weekday.
  const numFmt = new Intl.DateTimeFormat("en-US-u-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { timeZone, weekday: "short" });

  const parts = numFmt.formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: parseInt(pick("year"), 10),
    month: parseInt(pick("month"), 10),
    day: parseInt(pick("day"), 10),
    hour: parseInt(pick("hour"), 10),
    minute: parseInt(pick("minute"), 10),
    weekday: weekdayFmt.format(date),
  };
}

function getShortOffsetLabel(date: Date, timeZone: string): string {
  // Best-effort offset string like "GMT+2" / "UTC+1".
  try {
    const fmt = new Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "shortOffset" as any,
    });
    const parts = fmt.formatToParts(date);
    const tz = parts.find((p) => p.type === "timeZoneName")?.value;
    return tz || "";
  } catch {
    try {
      const asLocal = new Date(date.toLocaleString("en-US", { timeZone }));
      const offsetMin = Math.round((asLocal.getTime() - date.getTime()) / 60000);
      const sign = offsetMin >= 0 ? "+" : "-";
      const abs = Math.abs(offsetMin);
      const hh = String(Math.floor(abs / 60)).padStart(2, "0");
      const mm = String(abs % 60).padStart(2, "0");
      return `GMT${sign}${hh}:${mm}`;
    } catch {
      return "";
    }
  }
}

function ymdKey(p: Parts): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function formatHM(p: Parts): string {
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function normalizeSelection(list: string[]): string[] {
  // Keep exactly one trailing empty row.
  const trimmed = [...list];
  while (
    trimmed.length > 2 &&
    trimmed[trimmed.length - 1] === "" &&
    trimmed[trimmed.length - 2] === ""
  ) {
    trimmed.pop();
  }
  if (trimmed[trimmed.length - 1] !== "") trimmed.push("");
  if (trimmed.length < 2) trimmed.push("");
  return trimmed;
}

function TimeZoneSelect({
  value,
  onChange,
  disabled,
  options,
  placeholder,
  used,
  lang,
  ariaLabelledBy,
  ariaDescribedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: string[];
  placeholder?: string;
  used: Set<string>;
  lang: Lang;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
        >
          <span className="truncate">
            {value ? (
              value
            ) : (
              <span className="text-muted-foreground">{placeholder ?? ""}</span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[min(520px,calc(100vw-2rem))]"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={t(lang, "searchPlaceholder")}
            aria-label={t(lang, "searchPlaceholder")}
          />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>{t(lang, "noTzFound")}</CommandEmpty>
            <CommandGroup>
              {options.map((tz) => {
                const isUsed = used.has(tz) && tz !== value;
                return (
                  <CommandItem
                    key={tz}
                    value={tz}
                    onSelect={() => {
                      if (isUsed) return;
                      onChange(tz);
                      setOpen(false);
                    }}
                    className={isUsed ? "opacity-40 pointer-events-none" : ""}
                  >
                    <span className="truncate">{tz}</span>
                    {isUsed ? (
                      <Badge variant="secondary" className="ml-auto">
                        {t(lang, "alreadyChosen")}
                      </Badge>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function TimeZoneOverlapTool() {
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
    } catch {
      return "Europe/Berlin";
    }
  }, []);

  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("tzo.lang");
      if (saved === "de" || saved === "en") return saved;
    } catch {
      // ignore
    }
    const nav = typeof navigator !== "undefined" ? navigator.language : "en";
    return nav.toLowerCase().startsWith("de") ? "de" : "en";
  });

  useEffect(() => {
    try {
      localStorage.setItem("tzo.lang", lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const locale = lang === "de" ? "de-DE" : "en-US";

  const timeZones = useMemo(() => safeSupportedTimeZones(), []);

  const [zones, setZones] = useState<string[]>(() =>
    normalizeSelection([userTimeZone, ""])
  );
  const [range, setRange] = useState<[number, number]>([9, 17]);
  const [now, setNow] = useState<Date>(() => new Date());
  const [srMessage, setSrMessage] = useState<string>("");

  useEffect(() => {
    const tmr = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(tmr);
  }, []);

  useEffect(() => {
    if (!srMessage) return;
    const tmr = setTimeout(() => setSrMessage(""), 1200);
    return () => clearTimeout(tmr);
  }, [srMessage]);

  const used = useMemo(() => new Set(zones.filter(Boolean)), [zones]);
  const activeZones = useMemo(() => zones.filter(Boolean), [zones]);
  const baseTz = userTimeZone;

  const baseMidnight = useMemo(() => {
    // Local midnight in the user's timezone (browser local).
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }, [now]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const overlaps = useMemo(() => {
    const [start, end] = range;
    return hours.map((h) => {
      const moment = new Date(baseMidnight);
      moment.setHours(h, 0, 0, 0);
      return activeZones.every((tz) => {
        const p = getParts(moment, tz, locale);
        return p.hour >= start && p.hour < end;
      });
    });
  }, [hours, baseMidnight, activeZones, range, locale]);

  const overlapIntervals = useMemo(() => {
    const intervals: Array<{ start: number; end: number }> = [];
    let inRun = false;
    let runStart = 0;
    for (let h = 0; h < 24; h++) {
      if (overlaps[h] && !inRun) {
        inRun = true;
        runStart = h;
      }
      if (inRun && (!overlaps[h] || h === 23)) {
        const runEnd = overlaps[h] && h === 23 ? 24 : h;
        intervals.push({ start: runStart, end: runEnd });
        inRun = false;
      }
    }
    return intervals;
  }, [overlaps]);

  function setZoneAt(index: number, tz: string) {
    setZones((prev) => {
      const next = [...prev];
      next[index] = tz;
      if (tz && index === next.length - 1) {
        next.push("");
        setSrMessage(t(lang, "ariaAddedRow"));
      }
      return normalizeSelection(next);
    });
  }

  function removeZoneAt(index: number) {
    setZones((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 || next[0] !== userTimeZone) next.unshift(userTimeZone);
      setSrMessage(t(lang, "ariaRemovedRow"));
      return normalizeSelection(next);
    });
  }

  const [startHour, endHour] = range;

  function setStartHour(n: number) {
    const s = clampInt(n, 0, 23);
    const e = Math.max(s + 1, endHour);
    setRange([s, Math.min(24, e)]);
  }

  function setEndHour(n: number) {
    const e = clampInt(n, 1, 24);
    const s = Math.min(startHour, e - 1);
    setRange([Math.max(0, s), e]);
  }

  const nowBase = getParts(now, baseTz, locale);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6" lang={lang === "de" ? "de" : "en"}>
      {/* Screen reader announcements for dynamic UI changes */}
      <div className="sr-only" role="status" aria-live="polite">
        {srMessage}
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {t(lang, "title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t(lang, "subtitle")}</p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t(lang, "language")}</span>
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              <Button
                type="button"
                variant={lang === "de" ? "secondary" : "ghost"}
                className="rounded-none"
                onClick={() => setLang("de")}
                aria-pressed={lang === "de"}
              >
                DE
              </Button>
              <Button
                type="button"
                variant={lang === "en" ? "secondary" : "ghost"}
                className="rounded-none"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                EN
              </Button>
            </div>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="gap-2"
          aria-label={`${t(lang, "now")}: ${nowBase.weekday} ${formatHM(nowBase)} (${baseTz})`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className="tabular-nums">
            {nowBase.weekday} {formatHM(nowBase)}
          </span>
          <span className="opacity-70">({baseTz})</span>
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t(lang, "timeZonesCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zones.map((tz, idx) => {
              const isUserRow = idx === 0;
              const canRemove = !isUserRow && tz !== "";
              const labelNowParts = tz ? getParts(now, tz, locale) : null;
              const offset = tz ? getShortOffsetLabel(now, tz) : "";

              const labelId = `tz-label-${idx}`;
              const descId = isUserRow ? `tz-desc-${idx}` : undefined;

              return (
                <div key={`${idx}-${isUserRow ? "user" : tz}`} className="flex items-center gap-2">
                  <div className="flex-1">
                    <span id={labelId} className="sr-only">
                      {isUserRow
                        ? baseTz
                        : tz ||
                          (idx === 1 ? t(lang, "tzPlaceholderFirst") : t(lang, "tzPlaceholderMore"))}
                    </span>

                    <TimeZoneSelect
                      value={isUserRow ? userTimeZone : tz}
                      onChange={(v) => setZoneAt(idx, v)}
                      disabled={isUserRow}
                      options={timeZones}
                      placeholder={idx === 1 ? t(lang, "tzPlaceholderFirst") : t(lang, "tzPlaceholderMore")}
                      used={used}
                      lang={lang}
                      ariaLabelledBy={labelId}
                      ariaDescribedBy={descId}
                    />

                    {isUserRow ? (
                      <div id={descId} className="mt-1 text-xs text-muted-foreground">
                        {t(lang, "yourTzLocked")}
                      </div>
                    ) : tz ? (
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {labelNowParts?.weekday} {labelNowParts ? formatHM(labelNowParts) : ""}
                        </span>
                        <span className="tabular-nums">{offset}</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t(lang, "emptyHint")}
                      </div>
                    )}
                  </div>

                  {canRemove ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeZoneAt(idx)}
                      aria-label={t(lang, "removeZone")}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            })}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t(lang, "windowTitle")}</div>
                <Badge variant="outline" className="tabular-nums">
                  {String(startHour).padStart(2, "0")}:00–{String(endHour).padStart(2, "0")}:00
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t(lang, "windowHint")}</p>

              {/* Accessible (native) controls for the time window */}
              <fieldset className="mt-3 space-y-3">
                <legend className="sr-only">{t(lang, "rangeLegend")}</legend>

                <div className="space-y-2">
                  <label htmlFor="start-range" className="text-xs text-muted-foreground">
                    {t(lang, "startRange")}
                  </label>
                  <input
                    id="start-range"
                    type="range"
                    min={0}
                    max={23}
                    step={1}
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="end-range" className="text-xs text-muted-foreground">
                    {t(lang, "endRange")}
                  </label>
                  <input
                    id="end-range"
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="start-hour" className="text-xs text-muted-foreground">
                      {t(lang, "start")}
                    </label>
                    <Input
                      id="start-hour"
                      value={startHour}
                      inputMode="numeric"
                      aria-label={t(lang, "start")}
                      onChange={(e) => {
                        const n = clampInt(parseInt(e.target.value || "0", 10), 0, 23);
                        setStartHour(n);
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="end-hour" className="text-xs text-muted-foreground">
                      {t(lang, "end")}
                    </label>
                    <Input
                      id="end-hour"
                      value={endHour}
                      inputMode="numeric"
                      aria-label={t(lang, "end")}
                      onChange={(e) => {
                        const n = clampInt(parseInt(e.target.value || "0", 10), 1, 24);
                        setEndHour(n);
                      }}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="mt-4 rounded-lg border border-border p-3">
                <div className="text-sm font-medium">{t(lang, "todayOverlap")}</div>
                <div className="mt-2 flex flex-wrap gap-2" aria-live="polite">
                  {overlapIntervals.length === 0 ? (
                    <Badge variant="secondary">{t(lang, "noOverlap")}</Badge>
                  ) : (
                    overlapIntervals.map((itv, i) => (
                      <Badge key={i} variant="secondary" className="tabular-nums">
                        {String(itv.start).padStart(2, "0")}:00–{String(itv.end).padStart(2, "0")}:00
                      </Badge>
                    ))
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {t(lang, "base")}: {baseTz} • {t(lang, "date")}: {getParts(baseMidnight, baseTz, locale).weekday}{" "}
                  {ymdKey(getParts(baseMidnight, baseTz, locale))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t(lang, "gridTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeZones.length < 2 ? (
              <div className="text-sm text-muted-foreground">{t(lang, "needAtLeastOne")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">{t(lang, "tableCaption")}</caption>
                  <thead>
                    <tr className="text-left">
                      <th
                        scope="col"
                        className="sticky left-0 z-10 bg-background border-b border-border p-2 min-w-[160px]"
                      >
                        <div className="font-medium">{t(lang, "yourTime")}</div>
                        <div className="text-xs text-muted-foreground truncate">{baseTz}</div>
                      </th>
                      {activeZones.map((tz) => {
                        const offset = getShortOffsetLabel(now, tz);
                        const pNow = getParts(now, tz, locale);
                        return (
                          <th key={tz} scope="col" className="border-b border-border p-2 min-w-[210px]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium truncate">{tz}</div>
                              <Badge variant="outline" className="tabular-nums shrink-0">
                                {offset || ""}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {t(lang, "now")}: {pNow.weekday} {formatHM(pNow)}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((h) => {
                      const moment = new Date(baseMidnight);
                      moment.setHours(h, 0, 0, 0);
                      const baseParts = getParts(moment, baseTz, locale);

                      return (
                        <tr key={h} className={overlaps[h] ? "bg-[hsl(var(--muted))]/60" : ""}>
                          <th
                            scope="row"
                            className="sticky left-0 z-10 bg-background border-b border-border p-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="tabular-nums font-medium">
                                {String(h).padStart(2, "0")}:00
                              </span>
                              {overlaps[h] ? (
                                <Badge className="tabular-nums">{t(lang, "overlap")}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {baseParts.weekday} {String(baseParts.day).padStart(2, "0")}.{String(baseParts.month).padStart(2, "0")}.
                            </div>
                          </th>

                          {activeZones.map((tz) => {
                            const p = getParts(moment, tz, locale);
                            const baseKey = ymdKey(getParts(moment, baseTz, locale));
                            const localKey = ymdKey(p);
                            const dayDelta =
                              localKey === baseKey ? 0 : localKey > baseKey ? 1 : -1;

                            const inWindow = p.hour >= startHour && p.hour < endHour;

                            return (
                              <td key={`${h}-${tz}`} className="border-b border-border p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="tabular-nums">{formatHM(p)}</span>
                                  <div className="flex items-center gap-2">
                                    {dayDelta !== 0 ? (
                                      <Badge
                                        variant="secondary"
                                        className="tabular-nums"
                                        aria-label={dayDelta > 0 ? "+1 day" : "-1 day"}
                                      >
                                        {dayDelta > 0 ? "+1d" : "-1d"}
                                      </Badge>
                                    ) : null}
                                    {inWindow ? (
                                      <Badge variant="outline">{t(lang, "inWindow")}</Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {t(lang, "outside")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">{p.weekday}</div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">{t(lang, "tip")}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
