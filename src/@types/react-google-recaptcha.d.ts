declare module 'react-google-recaptcha' {
  import * as React from 'react';

  interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    size?: 'compact' | 'normal' | 'invisible';
    theme?: 'light' | 'dark';
    tabindex?: number;
    badge?: 'bottomright' | 'bottomleft' | 'inline';
  }

  export default class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
    reset: any;
    execute(): any {
      throw new Error("Method not implemented.");
    }
  }
}
