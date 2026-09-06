export type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type AuthSessionWithUser = AuthSessionRecord & {
  user: AuthUserRecord;
};

export type AuthStore = {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  createUser(email: string, passwordHash: string): Promise<AuthUserRecord>;
  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<AuthSessionRecord>;
  findSessionByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionWithUser | null>;
  deleteSessionById(id: string): Promise<void>;
};
