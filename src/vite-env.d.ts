/// <reference types="vite/client" />

type cocoMessageOptions = {
  success: Function;
  error: Function;
  info: Function;
  warning: Function;
};

declare const __API_URL__: string;
declare const cocoMessage: cocoMessageOptions;
