import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface CaptchaProps {
  onChange: (token: string | null) => void;
}

export interface CaptchaRef {
  reset: () => void;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ onChange }, ref) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [mounted, setMounted] = useState(false);
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useImperativeHandle(ref, () => ({
    reset() {
      recaptchaRef.current?.reset();
    },
  }));

  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ VITE_RECAPTCHA_SITE_KEY não definida no .env");
    }
    return null;
  }

  if (!mounted) return null;

  return (
    <div className="w-full flex justify-center mt-4">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={onChange}
        ref={recaptchaRef}
      />
    </div>
  );
});

Captcha.displayName = "Captcha";
