export interface Client {
  id: string | number;
  user_id?: string;
  admin_id?: string;
  support_number?: string;
  username: string;
  name: string;
  email: string;
  expiration_date: string;
  balance: number;
  renewal_link: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  duration: string;
  payment_link: string;
  features: string;
  created_at: string;
}
