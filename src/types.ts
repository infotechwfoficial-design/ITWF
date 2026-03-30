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
  avatar_url?: string;
  onboarding_completed?: boolean;
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

export interface Admin {
  id: string; // Mudado de number para string (UUID no banco)
  user_id: string;
  email: string;
  role: 'master' | 'admin';
  name: string;
  created_at: string;
  support_number?: string;
  push_logo_url?: string;
}

// Type Guards para segurança de tipos no frontend
export function isClient(profile: Client | Admin | null): profile is Client {
  return profile !== null && (profile as Client).username !== undefined;
}

export function isAdmin(profile: Client | Admin | null): profile is Admin {
  return profile !== null && ((profile as Admin).role === 'admin' || (profile as Admin).role === 'master');
}
