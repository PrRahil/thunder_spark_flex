import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { createHash } from 'crypto';
import type { AuthTokens, User } from '@thunder-spark/shared';
import { loginSchema, registerSchema } from '@thunder-spark/shared';
import { InMemoryStore } from '../../store/in-memory.store';

interface TokenPayload {
  sub: string;
  email: string;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

  constructor(private readonly store: InMemoryStore) {}

  async register(body: unknown): Promise<{ user: User; tokens: AuthTokens }> {
    const input = registerSchema.parse(body);
    if (this.store.findUserByEmail(input.email)) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await hash(input.password, 10);
    const user = this.store.createUser(input.email, input.name, passwordHash);
    const tokens = this.issueTokens(user);
    return { user, tokens };
  }

  async login(body: unknown): Promise<{ user: User; tokens: AuthTokens }> {
    const input = loginSchema.parse(body);
    const stored = this.store.findUserByEmail(input.email);
    if (!stored || !(await compare(input.password, stored.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = this.store.toPublicUser(stored);
    const tokens = this.issueTokens(user);
    return { user, tokens };
  }

  verifyAccessToken(token: string): User | null {
    const payload = this.decodeToken(token, this.accessSecret);
    if (!payload) return null;
    const stored = this.store.findUserById(payload.sub);
    return stored ? this.store.toPublicUser(stored) : null;
  }

  private issueTokens(user: User): AuthTokens {
    const accessToken = this.signToken(
      { sub: user.id, email: user.email, exp: Date.now() + 3600_000 },
      this.accessSecret,
    );
    const refreshToken = this.signToken(
      { sub: user.id, email: user.email, exp: Date.now() + 7 * 86400_000 },
      this.refreshSecret,
    );
    this.store.refreshTokens.set(refreshToken, user.id);
    return { accessToken, refreshToken, expiresIn: 3600 };
  }

  private signToken(payload: TokenPayload, secret: string): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHash('sha256').update(`${body}.${secret}`).digest('base64url');
    return `${body}.${sig}`;
  }

  private decodeToken(token: string, secret: string): TokenPayload | null {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = createHash('sha256').update(`${body}.${secret}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  }
}
