import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "operra_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET ||
    "operra-super-secret-jwt-key-versaly-2026-production-ready"
);

export interface SessionPayload {
  sessionId: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

// Fast short-lived in-memory cache so navigating across workspace routes and APIs
// does not repeatedly hit PostgreSQL for the same session & unread count.
const CONTEXT_TTL_MS = 20_000;
const contextCache = new Map<
  string,
  { data: NonNullable<Awaited<ReturnType<typeof fetchContextFromDb>>>; expiresAt: number }
>();
const unreadCache = new Map<string, { count: number; expiresAt: number }>();

export function invalidateAuthCache(userId?: string) {
  if (!userId) {
    contextCache.clear();
    unreadCache.clear();
    return;
  }
  for (const key of contextCache.keys()) {
    if (key.startsWith(`${userId}:`)) contextCache.delete(key);
  }
  for (const key of unreadCache.keys()) {
    if (key.startsWith(`${userId}:`)) unreadCache.delete(key);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createUserSession(
  userId: string,
  organizationId: string,
  role: UserRole,
  isSuperAdmin = false
) {
  invalidateAuthCache(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const dbSession = await prisma.session.create({
    data: {
      token: crypto.randomUUID(),
      userId,
      activeOrgId: organizationId,
      expiresAt,
    },
  });

  const jwtToken = await createSessionToken({
    sessionId: dbSession.id,
    userId,
    organizationId,
    role,
    isSuperAdmin,
  });

  await prisma.session.update({
    where: { id: dbSession.id },
    data: { token: jwtToken },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return jwtToken;
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.userId) {
      invalidateAuthCache(payload.userId);
    }
    if (payload?.sessionId) {
      await prisma.session.deleteMany({
        where: { id: payload.sessionId },
      });
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function fetchContextFromDb(payload: SessionPayload) {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user || user.status === "SUSPENDED") return null;

  const activeMembership =
    user.memberships.find((m) => m.organizationId === payload.organizationId) ||
    user.memberships[0];

  if (!activeMembership) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
    },
    organization: activeMembership.organization,
    membership: {
      id: activeMembership.id,
      role: user.isSuperAdmin
        ? ("SUPER_ADMIN" as UserRole)
        : activeMembership.role,
      title: activeMembership.title,
    },
    allOrganizations: user.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      currency: m.organization.currency,
    })),
  };
}

export const getCurrentContext = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const cacheKey = `${payload.userId}:${payload.organizationId}`;
  const cached = contextCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const fresh = await fetchContextFromDb(payload);
  if (fresh) {
    contextCache.set(cacheKey, {
      data: fresh,
      expiresAt: now + CONTEXT_TTL_MS,
    });
  }
  return fresh;
});

export const getCachedUnreadNotificationsCount = cache(
  async (organizationId: string, userId: string) => {
    const key = `${userId}:${organizationId}`;
    const now = Date.now();
    const cached = unreadCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.count;
    }

    const count = await prisma.notification.count({
      where: {
        organizationId,
        isRead: false,
        OR: [{ userId: null }, { userId }],
      },
    });

    unreadCache.set(key, { count, expiresAt: now + 15_000 });
    return count;
  }
);

export async function requireAuth() {
  const context = await getCurrentContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}
