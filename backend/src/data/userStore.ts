import { User } from '../models/user';

const users: User[] = [];
let idCounter = 1;

export function findByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function create(user: Omit<User, 'id' | 'createdAt'>): User {
  const now = new Date();
  const newUser: User = {
    ...user,
    id: String(idCounter++),
    createdAt: now,
  };
  users.push(newUser);
  return newUser;
}
