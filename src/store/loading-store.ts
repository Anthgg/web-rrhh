import { useSyncExternalStore } from "react";

export type LoadingVariant = "default" | "processing";

export interface LoadingOptions {
 message?: string;
 description?: string;
 variant?: LoadingVariant;
}

interface LoadingState {
 isLoading: boolean;
 message: string;
 description?: string;
 variant: LoadingVariant;
 pendingCount: number;
}

const defaultState: LoadingState = {
 isLoading: false,
 message: "Cargando informacion...",
 description: undefined,
 variant: "default",
 pendingCount: 0,
};

let state = defaultState;
const listeners = new Set<() => void>();

function emit() {
 listeners.forEach((listener) => listener());
}

function getSnapshot() {
 return state;
}

function subscribe(listener: () => void) {
 listeners.add(listener);
 return () => {
 listeners.delete(listener);
 };
}

export function showLoading(options: LoadingOptions = {}) {
 state = {
 ...state,
 isLoading: true,
 pendingCount: state.pendingCount + 1,
 message: options.message ?? defaultState.message,
 description: options.description,
 variant: options.variant ?? "default",
 };
 emit();
}

export function hideLoading() {
 const pendingCount = Math.max(0, state.pendingCount - 1);

 state = pendingCount > 0
 ? {
 ...state,
 pendingCount,
 }
 : defaultState;

 emit();
}

export function resetLoading() {
 state = defaultState;
 emit();
}

export function useLoadingState() {
 return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function withGlobalLoading<T>(
 task: () => Promise<T>,
 options: LoadingOptions,
): Promise<T> {
 showLoading(options);

 try {
 return await task();
 } finally {
 hideLoading();
 }
}
