"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { geographyService } from "@/services/geography.service";
import { organizationService } from "@/services/organization.service";
import { orgKeys } from "@/components/settings/organization/hooks/useOrganizationData";

interface CreateWorkLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newLocationId: string) => void;
}

export function CreateWorkLocationModal({ isOpen, onClose, onSuccess }: CreateWorkLocationModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [geoDepartmentId, setGeoDepartmentId] = useState("");
  const [geoProvinceId, setGeoProvinceId] = useState("");
  const [geoDistrictId, setGeoDistrictId] = useState("");

  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["geography-departments"],
    queryFn: () => geographyService.getDepartments(),
    enabled: isOpen,
  });

  const { data: provinces, isLoading: isLoadingProv } = useQuery({
    queryKey: ["geography-provinces", geoDepartmentId],
    queryFn: () => geographyService.getProvinces(geoDepartmentId),
    enabled: isOpen && Boolean(geoDepartmentId),
  });

  const { data: districts, isLoading: isLoadingDist } = useQuery({
    queryKey: ["geography-districts", geoProvinceId],
    queryFn: () => geographyService.getDistricts(geoProvinceId),
    enabled: isOpen && Boolean(geoProvinceId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      organizationService.createWorkLocation({
        name,
        address,
        geographyDepartmentId: geoDepartmentId,
        geographyProvinceId: geoProvinceId,
        geographyDistrictId: geoDistrictId,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.workLocations() });
      if (onSuccess && data?.id) {
        onSuccess(data.id);
      }
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Crear Lugar de Trabajo</h2>
        
        <div className="space-y-4">
          <FieldFrame label="Nombre del Lugar">
            <Input
              placeholder="Ej. Sede Central Lima"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FieldFrame>

          <FieldFrame label="Dirección">
            <Input
              placeholder="Ej. Av. Principal 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FieldFrame>

          <FieldFrame label="Departamento">
            <Select
              value={geoDepartmentId}
              onChange={(e) => {
                setGeoDepartmentId(e.target.value);
                setGeoProvinceId("");
                setGeoDistrictId("");
              }}
              disabled={isLoadingDepts || createMutation.isPending}
            >
              <option value="">Selecciona Departamento...</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Provincia">
            <Select
              value={geoProvinceId}
              onChange={(e) => {
                setGeoProvinceId(e.target.value);
                setGeoDistrictId("");
              }}
              disabled={!geoDepartmentId || isLoadingProv || createMutation.isPending}
            >
              <option value="">Selecciona Provincia...</option>
              {provinces?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Distrito">
            <Select
              value={geoDistrictId}
              onChange={(e) => setGeoDistrictId(e.target.value)}
              disabled={!geoProvinceId || isLoadingDist || createMutation.isPending}
            >
              <option value="">Selecciona Distrito...</option>
              {districts?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </FieldFrame>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={!name || !address || !geoDistrictId || createMutation.isPending}
          >
            {createMutation.isPending ? "Guardando..." : "Guardar Lugar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
