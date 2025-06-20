import ReCAPTCHA from "react-google-recaptcha";
import { useEffect, useState } from "react";

interface CaptchaProps {
  onChange: (token: string | null) => void;
}

export function Captcha({ onChange }: CaptchaProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ VITE_RECAPTCHA_SITE_KEY não definida no .env");
    }
    return null;
  }

  if (!mounted) return null;

  return (
    <div className="w-full flex justify-center mt-4">
      <ReCAPTCHA sitekey={siteKey} onChange={onChange} />
    </div>
  );
}
