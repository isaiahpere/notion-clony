"use client";

import { useState, useEffect } from "react";

import { SettingsModal } from "@/components/modals/settings-modal";
import { CoverImageModal } from "@/components/modals/cover-image-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // prevent hydrate issues on server side

  return (
    <>
      <SettingsModal />
      <CoverImageModal />
    </>
  );
};
