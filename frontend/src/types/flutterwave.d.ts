declare module 'flutterwave-node-v3' {
  export interface FlutterwaveConfig {
    publicKey: string;
    secretKey: string;
  }

  export interface PaymentInitializePayload {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
      email: string;
      name: string;
    };
    customizations: {
      title: string;
      description: string;
      logo: string;
    };
    payment_options: string;
    meta: {
      user_id: string;
      billing_cycle: string;
      subscription_type: string;
    };
  }

  export interface PaymentInitializeResponse {
    status: string;
    message: string;
    data: {
      link: string;
    };
  }

  export interface TransactionVerifyPayload {
    tx_ref: string;
  }

  export interface TransactionVerifyResponse {
    status: string;
    message: string;
    data: {
      status: string;
      amount: number;
      currency: string;
      customer: {
        email: string;
        name: string;
      };
      meta: {
        billing_cycle: string;
        subscription_type: string;
      };
    };
  }

  export class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    Payment: {
      initialize(payload: PaymentInitializePayload): Promise<PaymentInitializeResponse>;
    };
    
    Transaction: {
      verify(payload: TransactionVerifyPayload): Promise<TransactionVerifyResponse>;
    };
  }
}



