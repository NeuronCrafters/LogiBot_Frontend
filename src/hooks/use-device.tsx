// import { useEffect, useState } from "react";
// import {
//   isMobile,
//   isTablet,
//   isDesktop,
//   isIOS,
//   browserName,
//   browserVersion,
//   osName
// } from "react-device-detect";

// export function useDevice() {
//   const [deviceInfo, setDeviceInfo] = useState({
//     deviceType: "Desconhecido",
//     isMobile: false,
//     isTablet: false,
//     isDesktop: false,
//     isIOS: false,
//     os: "Desconhecido",
//     browser: "Desconhecido",
//     browserVersion: "Desconhecido",
//   });

//   useEffect(() => {
//     let detectedDeviceType = "Desconhecido";

//     if (isMobile) detectedDeviceType = "Mobile";
//     if (isTablet) detectedDeviceType = "Tablet";
//     if (isDesktop) detectedDeviceType = "Desktop";

//     setDeviceInfo({
//       deviceType: detectedDeviceType,
//       isMobile,
//       isTablet,
//       isDesktop,
//       isIOS,
//       os: osName || "Desconhecido",
//       browser: browserName || "Desconhecido",
//       browserVersion: browserVersion || "Desconhecido",
//     });
//   }, []);

//   return deviceInfo;
// }
