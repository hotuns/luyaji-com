import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// 管理员账号配置
const ADMIN_ACCOUNTS = [
  { username: "admin", password: process.env.ADMIN_PASSWORD || "admin123" },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "admin",
      name: "管理员登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) {
          throw new Error("请输入用户名和密码");
        }

        const admin = ADMIN_ACCOUNTS.find(
          (a) => a.username === username && a.password === password
        );

        if (!admin) {
          throw new Error("用户名或密码错误");
        }

        return {
          id: admin.username,
          name: admin.username,
          role: "admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
