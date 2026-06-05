import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

// Patch global fetch through proxy before NextAuth initializes
if (proxyUrl) {
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
      authorization: {
        params: { prompt: "consent" },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
