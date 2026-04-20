import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

const handler = NextAuth({
  providers: [
    // Only add Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.password === "qurtubah2024") {
          let user = await db.user.findUnique({
            where: { email: "admin@qurtubah.edu.sa" },
          });
          if (!user) {
            user = await db.user.create({
              data: {
                email: "admin@qurtubah.edu.sa",
                name: "مدير النظام",
                role: "admin",
              },
            });
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        let dbUser = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name || "مستخدم",
              image: user.image,
              googleId: account.providerAccountId,
              role: "user",
            },
          });
        }
        if (account.providerAccountId && !dbUser.googleId) {
          await db.user.update({
            where: { id: dbUser.id },
            data: { googleId: account.providerAccountId, image: user.image },
          });
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          (session.user as Record<string, unknown>).id = dbUser.id;
          (session.user as Record<string, unknown>).role = dbUser.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "qurtubah-secret-key-for-dev",
});

export { handler as GET, handler as POST };
