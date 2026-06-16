import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { verifyPassword } from "@/lib/password";
import type { NextAuthConfig } from "next-auth";

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

// Only apply proxy agent when running locally (not on Vercel)
if (proxyUrl && !process.env.VERCEL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const undici = require("undici") as typeof import("undici");
    undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
    console.log("[auth] undici ProxyAgent set to", proxyUrl);
  } catch {
    console.warn("[auth] Failed to set undici ProxyAgent, OAuth may fail behind GFW");
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: { prompt: "consent" },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.trim().toLowerCase();
        const password = credentials.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // When signing in with GitHub, sync profile data (name, avatar)
      // This handles the case where allowDangerousEmailAccountLinking
      // links a GitHub account to an existing user with empty profile
      if (account?.provider === "github" && profile) {
        const ghProfile = profile as {
          name?: string;
          avatar_url?: string;
          login?: string;
        };
        // Only update if the user record is missing data
        const needsName = !user.name || user.name === "";
        const needsImage = !user.image || user.image === "";
        if (needsName || needsImage) {
          await prisma.user.update({
            where: { id: user.id! },
            data: {
              ...(needsName && {
                name: ghProfile.name || ghProfile.login || user.name,
              }),
              ...(needsImage && {
                image: ghProfile.avatar_url || user.image,
              }),
            },
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.image = user.image;
        session.user.email = user.email || "";
        session.user.isAdmin = await isAdmin(user.id);
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
