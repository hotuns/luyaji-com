import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

console.log("[auth config] loaded from apps/web/lib/auth.ts");

const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // 通用账号/手机号 + 密码登录（前台使用）
    Credentials({
      id: "credentials",
      name: "账号登录",
      credentials: {
        identifier: { label: "账号或手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.identifier as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) {
          throw new Error("请输入账号和密码");
        }

        // 判断是手机号还是昵称（或将来单独 username）
        const isPhone = /^1[3-9]\d{9}$/.test(identifier);

        const user = await prisma.user.findFirst({
          where: isPhone
            ? { phone: identifier }
            : { nickname: identifier },
        });

        if (!user || !user.passwordHash) {
          throw new Error("账号或密码错误");
        }

        if (user.isBanned) {
          throw new Error("账号已被封禁，如有疑问请联系管理员");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("账号或密码错误");
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.nickname,
          image: user.avatarUrl,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone?: string }).phone;
        (token as { isAdmin?: boolean }).isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { phone?: string }).phone = token.phone as string;
        (session.user as { isAdmin?: boolean }).isAdmin = (token as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
};

// NextAuth 返回的类型在 monorepo /打包时可能无法被正确命名引用。
// 我们把返回值断言为一个更明确的结构，以避免 TS 在构建时要求不可移植的类型引用。
const _nextAuth = NextAuth(authConfig) as unknown as {
  handlers: {
    GET?: (req: Request) => Response | Promise<Response>;
    POST?: (req: Request) => Response | Promise<Response>;
    // may include other methods, keep optional
    [key: string]: ((req: Request) => Response | Promise<Response>) | undefined;
  };
  auth: (...args: any[]) => Promise<any>;
  signIn: unknown;
  signOut: unknown;
};

export const { handlers, auth, signIn, signOut } = _nextAuth;
