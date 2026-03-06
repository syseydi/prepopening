// Auth service — login, signup, token issue/verify
// TODO: integrate with DB and JWT

export async function validateCredentials(
  _email: string,
  _password: string
): Promise<{ userId: string } | null> {
  return null;
}

export async function createUser(_email: string, _username: string, _password: string): Promise<{ userId: string } | null> {
  return null;
}

export function issueToken(_userId: string): string {
  return '';
}

export function verifyToken(_token: string): { userId: string } | null {
  return null;
}
