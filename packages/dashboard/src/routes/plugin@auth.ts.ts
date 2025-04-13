import { QwikAuth$ } from "@auth/qwik";
import GitHub from "@auth/core/providers/github";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  ({ env }) => ({
    trustHost: true,
    useSecureCookies: env.get("VITE_SSL") === "true",
    providers: [
      GitHub({
        clientId: env.get("AUTH_GITHUB_ID"),
        clientSecret: env.get("AUTH_GITHUB_SECRET"),
        authorization: {
          params: {
            scope: "read:user user:email repo",
          },
        },
      }),
    ],
    cookies: {
      pkceCodeVerifier: {
        name: "github.pkce.code_verifier",
        options: {
          httpOnly: true,
          sameSite: "none",
          path: "/",
          secure: true,
        },
      },
    },
    callbacks: {
      async session({ token, session }) {
        // @ts-ignore
        session.user.accessToken = token.accessToken;
        return session;
      },
      async jwt({ token, account }) {
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
    },
  })
);
