"use client";

import React, { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldFrame } from "@/components/ui/fields";
import { useDniSearch } from "../hooks/useDniSearch";
import type { UseFormSetValue } from "react-hook-form";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";

interface DniSearchSectionProps {
  setValue: UseFormSetValue<OnboardingFormValues>;
  dniValue: string;
  onChangeDni: (val: string) => void;
}

export function DniSearchSection({ setValue, dniValue, onChangeDni }: DniSearchSectionProps) {
  const { searchDni, isSearching, error, fullName, setFullName } = useDniSearch(setValue);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!dniValue || dniValue.length !== 8) return;
    await searchDni(dniValue);
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Consulta por DNI</h3>
      <p className="mb-4 text-xs text-slate-500">
        Ingresa el DNI del trabajador para consultar con el padrón electoral y autocompletar sus nombres.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FieldFrame label="Número de DNI">
            <Input
              value={dniValue}
              maxLength={8}
              placeholder="Ej. 74839201"
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onChangeDni(val);
                setValue("personalData.dni", val);
                setHasSearched(false);
                setFullName(null);
              }}
            />
          </FieldFrame>
        </div>
        <div className="sm:mb-0">
          <Button
            type="button"
            disabled={isSearching || dniValue.length !== 8}
            onClick={handleSearch}
            className="w-full h-10 rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 size-4" />
                Buscar DNI
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-600">
          <AlertCircle className="size-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasSearched && !error && !isSearching && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="size-4 flex-shrink-0" />
            <span>Nombres validados y autocompletados correctamente.</span>
          </div>
          {fullName && (
            <div className="ml-6 text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50 max-w-md animate-fadeIn">
              <span className="font-semibold text-slate-500">Nombre completo: </span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
