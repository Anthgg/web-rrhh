import React from "react";
import { sileo, Toaster as SileoToaster } from "sileo";

// Helper to convert string or custom arguments into Sileo's object format
const wrapMessage = (message: any, options?: any) => {
  if (typeof message === "string") {
    const title = message;
    let description = undefined;
    if (options && typeof options === "object") {
      if (typeof options.description === "string") {
        description = options.description;
      }
    }
    return { title, description };
  } else if (message && typeof message === "object") {
    return {
      title: message.title ?? message.message ?? String(message),
      description: message.description,
    };
  }
  return { title: String(message) };
};

const toastFn = (message: any, options?: any) => {
  return sileo.info(wrapMessage(message, options));
};

export const toast = Object.assign(toastFn, {
  success: (message: any, options?: any) => {
    return sileo.success(wrapMessage(message, options));
  },
  error: (message: any, options?: any) => {
    return sileo.error(wrapMessage(message, options));
  },
  warning: (message: any, options?: any) => {
    return sileo.warning(wrapMessage(message, options));
  },
  info: (message: any, options?: any) => {
    return sileo.info(wrapMessage(message, options));
  },
  promise: (promise: Promise<any> | (() => Promise<any>), data: { loading: string; success: any; error: any }) => {
    const runPromise = typeof promise === "function" ? promise() : promise;
    
    const loadingVal = wrapMessage(data.loading);
    const successVal = (res: any) => {
      const msg = typeof data.success === "function" ? data.success(res) : data.success;
      return wrapMessage(msg);
    };
    const errorVal = (err: any) => {
      const msg = typeof data.error === "function" ? data.error(err) : data.error;
      return wrapMessage(msg);
    };
    
    return sileo.promise(runPromise, {
      loading: loadingVal.title,
      success: successVal,
      error: errorVal,
    });
  },
  dismiss: (id?: string | number) => {
    // Sileo dismiss placeholder
  },
  loading: (message: any, options?: any) => {
    return sileo.info(wrapMessage(message, options));
  },
  message: (message: any, options?: any) => {
    return sileo.info(wrapMessage(message, options));
  },
  custom: (message: any, options?: any) => {
    return sileo.info(wrapMessage(message, options));
  }
});

export function Toaster(props: any) {
  const { position = "top-right" } = props;
  return React.createElement(SileoToaster, { position });
}
