declare module 'textlk-node' {
  export interface SMSParams {
    phoneNumber: string;
    message: string;
    apiToken?: string;
    senderId?: string;
  }

  export interface SMSResponse {
    success: boolean;
    message?: string;
    error?: string;
    [key: string]: any;
  }

  export function sendSMS(params: SMSParams): Promise<SMSResponse>;
}
