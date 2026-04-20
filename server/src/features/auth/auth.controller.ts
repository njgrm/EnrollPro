import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../lib/prisma.js";
import { auditLog } from "../audit-logs/audit-logs.service.js";
import { AppError } from "../../lib/AppError.js";

type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
};

type GoogleTokenPayload = {
  sub: string;
  email: string;
  emailVerified: boolean;
  hd?: string;
};

type GoogleIdTokenVerifier = (
  credential: string,
) => Promise<GoogleTokenPayload>;

const JWT_EXPIRES_IN: jwt.SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) ?? "7d";
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "enrollpro_session";
const GOOGLE_PROVIDER = "google";
const GOOGLE_SCOPE = "openid email profile";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const googleOauthClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

function parseExpiresInToMs(
  expiresIn: jwt.SignOptions["expiresIn"],
): number | undefined {
  if (typeof expiresIn === "number") {
    return expiresIn * 1000;
  }

  if (typeof expiresIn !== "string") {
    return undefined;
  }

  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return undefined;
}

function getCookieOptions(): CookieOptions {
  const maxAge = parseExpiresInToMs(JWT_EXPIRES_IN);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
}

function clearSessionCookie(res: Response): void {
  const options = getCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isGoogleIdentityAllowed(
  email: string,
  hostedDomain?: string,
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const allowedDomains = parseCsv(process.env.ALLOWED_GOOGLE_DOMAINS);
  const allowedEmails = parseCsv(process.env.ALLOWED_GOOGLE_EMAILS);

  if (allowedDomains.length === 0 && allowedEmails.length === 0) {
    return true;
  }

  if (allowedEmails.includes(normalizedEmail)) {
    return true;
  }

  const emailDomain = normalizedEmail.split("@")[1]?.toLowerCase();
  const normalizedHd = hostedDomain?.toLowerCase();

  if (!emailDomain && !normalizedHd) {
    return false;
  }

  return (
    (normalizedHd ? allowedDomains.includes(normalizedHd) : false) ||
    (emailDomain ? allowedDomains.includes(emailDomain) : false)
  );
}

function toUserResponse(user: AuthUser) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

function createAuthToken(user: AuthUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError(
      500,
      "JWT secret is not configured on the server.",
      "JWT_SECRET_MISSING",
    );
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

async function defaultGoogleIdTokenVerifier(
  credential: string,
): Promise<GoogleTokenPayload> {
  if (!GOOGLE_CLIENT_ID || !googleOauthClient) {
    throw new AppError(
      500,
      "Google OAuth is not configured on the server.",
      "GOOGLE_OAUTH_NOT_CONFIGURED",
    );
  }

  let ticket;
  try {
    ticket = await googleOauthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new AppError(
      401,
      "Invalid Google credential.",
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError(
      401,
      "Invalid Google credential.",
      "INVALID_GOOGLE_TOKEN",
    );
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    hd: payload.hd ?? undefined,
  };
}

let googleIdTokenVerifier: GoogleIdTokenVerifier = defaultGoogleIdTokenVerifier;

export function setGoogleIdTokenVerifierForTests(
  verifier: GoogleIdTokenVerifier,
): void {
  googleIdTokenVerifier = verifier;
}

export function resetGoogleIdTokenVerifierForTests(): void {
  googleIdTokenVerifier = defaultGoogleIdTokenVerifier;
}

export async function login(req: Request, res: Response): Promise<void> {
  const email = String(req.body.email).trim().toLowerCase();
  const { password } = req.body as { password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({
      message:
        "Your account has been deactivated. Contact the system administrator.",
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const now = new Date();
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: now },
  });

  await auditLog({
    userId: updatedUser.id,
    actionType: "USER_LOGIN",
    description: `User ${updatedUser.email} logged in from ${req.ip}`,
    req,
  });

  const token = createAuthToken(updatedUser);
  setSessionCookie(res, token);

  res.json({
    token,
    user: toUserResponse(updatedUser),
  });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential: string };
  const tokenPayload = await googleIdTokenVerifier(credential);

  if (!tokenPayload.emailVerified) {
    throw new AppError(
      401,
      "Google email must be verified before signing in.",
      "GOOGLE_EMAIL_NOT_VERIFIED",
    );
  }

  if (!isGoogleIdentityAllowed(tokenPayload.email, tokenPayload.hd)) {
    throw new AppError(
      403,
      "Domain restricted login: this Google account is not authorized.",
      "DOMAIN_RESTRICTED",
    );
  }

  const normalizedEmail = tokenPayload.email.trim().toLowerCase();
  const providerAccountId = tokenPayload.sub;
  const now = new Date();

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: GOOGLE_PROVIDER,
        providerAccountId,
      },
    },
    include: { user: true },
  });

  let authUser: AuthUser;

  if (existingAccount) {
    if (!existingAccount.user.isActive) {
      throw new AppError(
        401,
        "Account is inactive. Contact your system administrator.",
        "ACCOUNT_INACTIVE",
      );
    }

    const updatedAccount = await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        idToken: credential,
        tokenType: "Bearer",
        scope: GOOGLE_SCOPE,
        updatedAt: now,
        user: {
          update: {
            lastLoginAt: now,
          },
        },
      },
      include: {
        user: true,
      },
    });

    authUser = updatedAccount.user;
  } else {
    const invitedUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!invitedUser) {
      throw new AppError(
        403,
        "Your Google account is not invited to this system.",
        "INVITE_REQUIRED",
      );
    }

    if (!invitedUser.isActive) {
      throw new AppError(
        401,
        "Account is inactive. Contact your system administrator.",
        "ACCOUNT_INACTIVE",
      );
    }

    authUser = await prisma.$transaction(async (tx) => {
      await tx.account.create({
        data: {
          userId: invitedUser.id,
          type: "oauth",
          provider: GOOGLE_PROVIDER,
          providerAccountId,
          idToken: credential,
          tokenType: "Bearer",
          scope: GOOGLE_SCOPE,
        },
      });

      return tx.user.update({
        where: { id: invitedUser.id },
        data: { lastLoginAt: now },
      });
    });
  }

  const token = createAuthToken(authUser);
  setSessionCookie(res, token);

  await auditLog({
    userId: authUser.id,
    actionType: "USER_LOGIN",
    description: `User ${authUser.email} logged in via Google from ${req.ip}`,
    req,
  });

  res.json({
    token,
    user: toUserResponse(authUser),
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user });
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { newPassword } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    res.status(400).json({
      message: "New password cannot be the same as your current password.",
    });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashed,
      mustChangePassword: false,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      mustChangePassword: true,
      isActive: true,
      lastLoginAt: true,
    },
  });

  const token = createAuthToken(updated);
  setSessionCookie(res, token);

  res.json({ token, user: toUserResponse(updated) });
}
