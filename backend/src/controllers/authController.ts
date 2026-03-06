import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { UserWithoutPassword } from '../models/user';
import * as userStore from '../data/userStore';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const SALT_ROUNDS = 10;

function toUserResponse(user: { id: string; email: string; name: string; elo: number | null; createdAt: Date }): UserWithoutPassword {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    elo: user.elo,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, elo } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      elo?: number;
    };
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Missing required fields: name, email, password' });
      return;
    }
    if (userStore.findByEmail(email)) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = userStore.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      elo: elo != null ? Number(elo) : null,
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }
    const user = userStore.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export function me(req: AuthRequest, res: Response): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = userStore.findById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  res.json(toUserResponse(user));
}
