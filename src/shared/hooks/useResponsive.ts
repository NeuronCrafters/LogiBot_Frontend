import { useEffect, useState } from "react";

type ScreenType = "smartwatch" | "mobile" | "tablet" | "desktop" | "desktopHD";

interface ScreenInfo {
  isSmartwatch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isDesktopHD: boolean;
  orientation: "portrait" | "landscape";
  type: ScreenType;
}

export function useResponsive(): ScreenInfo {
  const [screen, setScreen] = useState<ScreenInfo>({
    isSmartwatch: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isDesktopHD: false,
    orientation: "portrait",
    type: "mobile",
  });

  const updateScreenInfo = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? "landscape" : "portrait";

    const isSmartwatch = width <= 400;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024 && width < 1440;
    const isDesktopHD = width >= 1440;

    let type: ScreenType = "mobile";
    if (isSmartwatch) type = "smartwatch";
    else if (isTablet) type = "tablet";
    else if (isDesktop) type = "desktop";
    else if (isDesktopHD) type = "desktopHD";

    setScreen({
      isSmartwatch,
      isMobile,
      isTablet,
      isDesktop,
      isDesktopHD,
      orientation,
      type,
    });
  };

  useEffect(() => {
    updateScreenInfo();
    window.addEventListener("resize", updateScreenInfo);
    window.addEventListener("orientationchange", updateScreenInfo);
    return () => {
      window.removeEventListener("resize", updateScreenInfo);
      window.removeEventListener("orientationchange", updateScreenInfo);
    };
  }, []);

  return screen;
}

export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}
