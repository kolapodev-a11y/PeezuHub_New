export interface AuthUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'admin' | string;
  premiumStatus?: string;
  premiumExpiresAt?: string;
}

export interface AuthPayload {
  user: AuthUser;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  accessToken?: string;
  access_token?: string;
  token?: string;
  credential?: string | { accessToken?: string };
  idToken?: string;
  mode?: 'login' | 'register' | string;
}
