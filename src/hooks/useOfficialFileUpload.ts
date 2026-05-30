"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  deleteCompanyLogo,
  deleteCompanySignature,
  deleteCompanyStamp,
  uploadCompanyLogo,
  uploadCompanySignature,
  uploadCompanyStamp,
} from "@/services/companySettingsService";
import type { CompanyAssetType } from "@/types";

export type OfficialFilePhase = "idle" | "uploading" | "deleting";

export type OfficialFileState = Record<
  CompanyAssetType,
  {
    phase: OfficialFilePhase;
    error: string | null;
  }
>;

interface UseOfficialFileUploadOptions {
  isConfigured: boolean;
  onAssetChange: (assetType: CompanyAssetType, nextUrl: string | null) => void;
  onRefresh?: () => Promise<unknown>;
}

const initialState: OfficialFileState = {
  logo: { phase: "idle", error: null },
  signature: { phase: "idle", error: null },
  stamp: { phase: "idle", error: null },
};

function getUploadHandler(assetType: CompanyAssetType) {
  if (assetType === "logo") return uploadCompanyLogo;
  if (assetType === "signature") return uploadCompanySignature;
  return uploadCompanyStamp;
}

function getDeleteHandler(assetType: CompanyAssetType) {
  if (assetType === "logo") return deleteCompanyLogo;
  if (assetType === "signature") return deleteCompanySignature;
  return deleteCompanyStamp;
}

function getConfigurationMessage() {
  return "Guarda primero la informacion legal antes de subir archivos oficiales.";
}

export function useOfficialFileUpload({
  isConfigured,
  onAssetChange,
  onRefresh,
}: UseOfficialFileUploadOptions) {
  const [fileStates, setFileStates] = useState<OfficialFileState>(initialState);

  function setAssetState(assetType: CompanyAssetType, phase: OfficialFilePhase, error: string | null = null) {
    setFileStates((current) => ({
      ...current,
      [assetType]: {
        phase,
        error,
      },
    }));
  }

  async function uploadOfficialFile(assetType: CompanyAssetType, file: File) {
    if (!isConfigured) {
      const message = getConfigurationMessage();
      setAssetState(assetType, "idle", message);
      toast.error(message);
      return false;
    }

    setAssetState(assetType, "uploading");

    try {
      const response = await getUploadHandler(assetType)(file);

      if (response.url) {
        onAssetChange(assetType, response.url);
      }

      await onRefresh?.();
      setAssetState(assetType, "idle");
      toast.success(response.message);
      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "No se pudo subir el archivo.";
      setAssetState(assetType, "idle", message);
      toast.error(message);
      return false;
    }
  }

  async function deleteOfficialFile(assetType: CompanyAssetType) {
    if (!isConfigured) {
      const message = getConfigurationMessage();
      setAssetState(assetType, "idle", message);
      toast.error(message);
      return false;
    }

    setAssetState(assetType, "deleting");

    try {
      const response = await getDeleteHandler(assetType)();

      onAssetChange(assetType, null);
      await onRefresh?.();
      setAssetState(assetType, "idle");
      toast.success(response.message);
      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "No se pudo eliminar el archivo.";
      setAssetState(assetType, "idle", message);
      toast.error(message);
      return false;
    }
  }

  const isUploadingAny = Object.values(fileStates).some((state) => state.phase === "uploading");
  const isDeletingAny = Object.values(fileStates).some((state) => state.phase === "deleting");

  return {
    fileStates,
    isUploadingAny,
    isDeletingAny,
    uploadOfficialFile,
    deleteOfficialFile,
  };
}
