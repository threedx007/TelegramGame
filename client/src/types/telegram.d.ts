declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        sendData(data: string): void;
        showPopup(params: {
          title: string;
          message: string;
          buttons: Array<{
            id?: string;
            type: 'default' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }): void;
      };
    };
  }
}

export {};