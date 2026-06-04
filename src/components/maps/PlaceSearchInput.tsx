"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaceSuggestion {
  place_id?: string | number;
  name?: string;
  display_name?: string;
  address?: string;
  latitude: number | string;
  longitude: number | string;
  department_id?: string;
  department_name?: string;
  province_id?: string;
  province_name?: string;
  district_id?: string;
  district_name?: string;
  geographic_department_id?: string;
  geographic_province_id?: string;
  geographic_district_id?: string;
}

interface PlaceSearchInputProps {
  disabled?: boolean;
  onSelect: (place: PlaceSuggestion) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Primary label: prefer `name`, fall back to first segment of display_name */
function primaryLabel(place: PlaceSuggestion): string {
  if (place.name) return place.name;
  if (place.display_name) return place.display_name.split(",")[0].trim();
  return place.address ?? "Lugar sin nombre";
}

/** Secondary label: short address + ubigeo chain */
function secondaryLabel(place: PlaceSuggestion): string {
  const parts: string[] = [];
  if (place.address) parts.push(place.address);
  else if (place.display_name) {
    // Skip the first segment (already in primaryLabel) and take up to 2 more
    const segments = place.display_name.split(",").slice(1, 3).map((s) => s.trim());
    parts.push(...segments);
  }
  const ubigeo: string[] = [];
  if (place.district_name) ubigeo.push(place.district_name);
  if (place.province_name) ubigeo.push(place.province_name);
  if (place.department_name) ubigeo.push(place.department_name);
  if (ubigeo.length) parts.push(ubigeo.join(", "));
  return parts.join(" · ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlaceSearchInput({ disabled, onSelect }: PlaceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Holds the debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the AbortController for the in-flight request
  const abortRef = useRef<AbortController | null>(null);

  // ── Search ────────────────────────────────────────────────────────────────

  const runSearch = useCallback((text: string) => {
    // Cancel any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (text.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMessage(null);
    setIsOpen(true); // Open dropdown to show "Buscando..."

    fetch(
      `/api/work-locations/places/search?q=${encodeURIComponent(text)}&limit=5`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Error al buscar lugares");
        return res.json();
      })
      .then((data) => {
        const list: PlaceSuggestion[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        setSuggestions(list);
        setStatus("done");
        setActiveIndex(-1);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return; // Cancelled — ignore
        setErrorMessage("No se pudo buscar. Puedes ingresar la dirección y coordenadas manualmente.");
        setSuggestions([]);
        setStatus("error");
        setIsOpen(false);
      });
  }, []);

  // ── Debounced onChange ────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 380);
  };

  // ── Outside click ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      // Cancel any pending request on unmount
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Selection ─────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (place: PlaceSuggestion) => {
      onSelect(place);
      setQuery("");
      setSuggestions([]);
      setIsOpen(false);
      setStatus("idle");
      setActiveIndex(-1);
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [onSelect]
  );

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setStatus("idle");
    setErrorMessage(null);
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.focus();
  };

  // ── Dropdown content ──────────────────────────────────────────────────────

  const showDropdown = isOpen && query.length >= 3;

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (suggestions.length > 0 || status === "loading") setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Escribe un lugar, dirección o referencia..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
        {/* Right icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin text-indigo-400" />
          ) : query ? (
            <button
              type="button"
              onClick={clearSearch}
              tabIndex={-1}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Hint under input — error */}
      {errorMessage && (
        <p className="mt-1.5 text-xs text-amber-600">{errorMessage}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Sugerencias de lugares"
          className="absolute left-0 top-full z-[500] mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {status === "loading" ? (
            /* Loading state */
            <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin shrink-0" />
              Buscando...
            </div>
          ) : suggestions.length === 0 ? (
            /* Empty state */
            <div className="px-4 py-3 text-sm text-slate-400">
              No se encontraron lugares.
            </div>
          ) : (
            /* Results */
            <ul className="max-h-64 overflow-y-auto p-1" style={{ scrollbarWidth: "thin" }}>
              {suggestions.map((place, idx) => (
                <li key={place.place_id != null ? String(place.place_id) : idx} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur
                      handleSelect(place);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      idx === activeIndex
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin
                      className={`mt-0.5 size-4 shrink-0 ${
                        idx === activeIndex ? "text-indigo-500" : "text-indigo-300"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug">
                        {primaryLabel(place)}
                      </p>
                      {secondaryLabel(place) && (
                        <p className="mt-0.5 truncate text-xs leading-snug text-slate-400">
                          {secondaryLabel(place)}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
