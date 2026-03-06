export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  elo: number | null;
  createdAt: Date;
}

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
