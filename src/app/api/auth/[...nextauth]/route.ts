import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { AuthResponseBody, EmailLoginResponse } from "@/lib/types/authentication.types"

export const auth = NextAuth({
  providers: [
    CredentialsProvider({
      id: "siwe",
      name: "SIWE",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        walletAddress: { label: "Wallet Address", type: "text" }
      },
      async authorize(credentials) {
        console.log("NextAuth SIWE authorize called with credentials:", {
          message: credentials?.message ? "present" : "missing",
          signature: credentials?.signature ? "present" : "missing",
          walletAddress: credentials?.walletAddress || "missing"
        });
        
        if (!credentials?.message || !credentials?.signature || !credentials?.walletAddress) {
          console.log("Missing SIWE credentials");
          return null
        }

        try {
          const payload = JSON.stringify({ 
            message: credentials.message, 
            signature: credentials.signature 
          })
          
          console.log("Calling SIWE API with payload:", payload);
          
          const res = await fetch(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          })
          
          const data = await res.json() as AuthResponseBody
          console.log("SIWE API response:", JSON.stringify(data, null, 2));
          
                  if (data.success) {
          const user = {
            id: data.userId,
            userId: data.userId,
            accountId: data.accountId,
            accountName: data.accountName,
            accountEmail: data.accountEmail,
            walletAddress: credentials.walletAddress,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            authMethod: 'siwe' as const,
            mfaRequired: false,
            mfaSetupRequired: false,
            permissions: data.permissions,
          };
            console.log("Returning SIWE user:", JSON.stringify(user, null, 2));
            return user;
          }
          
          console.log("SIWE API call failed");
          return null
        } catch (error) {
          console.error("SIWE authentication error:", error)
          return null
        }
      }
    }),
    CredentialsProvider({
      id: "email-password",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userId: { label: "User ID", type: "text" },
        mfaVerified: { label: "MFA Verified", type: "text" },
        // Populated after verifyMfa(); passed from client on the MFA sign-in step
        accountId: { label: "Account ID", type: "text" },
        accountName: { label: "Account Name", type: "text" },
        accountEmail: { label: "Account Email", type: "text" },
        accessToken: { label: "Access Token", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
        walletAddress: { label: "Wallet Address", type: "text" }
      },
      async authorize(credentials) {
        console.log("NextAuth Email/Password authorize called with credentials:", {
          email: credentials?.email ? "present" : "missing",
          password: credentials?.password ? "present" : "missing",
          userId: credentials?.userId || "missing",
          mfaVerified: credentials?.mfaVerified || "missing"
        });
        
        // If MFA is already verified, we have the user ID
        if (credentials?.userId && credentials?.mfaVerified === 'true') {
          // User has already been authenticated and MFA verified
          // We can return a user object with the existing data
          // This would typically come from a previous authentication step
          const user = {
            id: credentials.userId,
            userId: credentials.userId,
            accountId: credentials.accountId || '',
            accountName: credentials.accountName || '',
            accountEmail: credentials.accountEmail || credentials.email || '',
            walletAddress: credentials.walletAddress || undefined,
            accessToken: credentials.accessToken || '',
            refreshToken: credentials.refreshToken || '',
            authMethod: 'email-password' as const,
            mfaRequired: false,
            mfaSetupRequired: false,
            permissions: [], // Will be populated from the API response
          };
          console.log("Returning MFA-verified user:", JSON.stringify(user, null, 2));
          return user;
        }
        
        // Initial email/password authentication
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email/password credentials");
          return null
        }

        try {
          const payload = JSON.stringify({ 
            email: credentials.email, 
            password: credentials.password 
          })
          
          console.log("Calling Email/Password API with payload:", payload);
          
          const res = await fetch(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/login/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          })
          
          const data = await res.json() as EmailLoginResponse
          console.log("Email/Password API response:", JSON.stringify(data, null, 2));
          
          if (data.success) {
                      const user = {
            id: data.userId,
            userId: data.userId,
            accountId: data.accountId,
            accountName: data.accountName,
            accountEmail: data.accountEmail,
            walletAddress: data.walletAddress,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            authMethod: 'email-password' as const,
            mfaRequired: data.mfaRequired,
            mfaSetupRequired: data.mfaSetupRequired,
            permissions: data.permissions,
          };
            console.log("Returning Email/Password user:", JSON.stringify(user, null, 2));
            return user;
          }
          
          console.log("Email/Password API call failed");
          return null
        } catch (error) {
          console.error("Email/Password authentication error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // console.log("JWT callback called:", {
      //   hasUser: !!user,
      //   trigger,
      //   hasSession: !!session,
      //   tokenKeys: Object.keys(token)
      // });
      console.log("JWT callback called:")

      // Initial sign in
      if (user) {
        console.log("Setting JWT token with user data:", JSON.stringify(user, null, 2));
        token.userId = user.userId || user.id
        token.accountId = user.accountId
        token.accountName = user.accountName
        token.accountEmail = user.accountEmail
        token.walletAddress = user.walletAddress
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.authMethod = user.authMethod
        token.mfaRequired = user.mfaRequired
        token.mfaSetupRequired = user.mfaSetupRequired
        token.permissions = user.permissions || []
        token.id = user.userId || user.id // Also set the standard id field
      }

      // Handle token refresh
      if (trigger === "update" && session?.accessToken) {
        token.accessToken = session.accessToken
        token.refreshToken = session.refreshToken
      }

      // Check if access token needs refresh
      if (token.accessToken && token.refreshToken) {
        // You can add token expiration logic here if needed
        // For now, we'll keep the tokens as they are
      }

      //console.log("Final JWT token:", JSON.stringify(token, null, 2));
      return token
    },
    async session({ session, token }) {
      // console.log("Session callback called:", {
      //   hasToken: !!token,
      //   tokenKeys: token ? Object.keys(token) : [],
      //   sessionKeys: Object.keys(session)
      // });
      console.log("Session callback called:")
      
      if (token) {
        //console.log("Setting session with token data:", JSON.stringify(token, null, 2));
        console.log("Setting session with token data");
        // Ensure the user object exists and has the correct structure
        session.user = {
          id: token.userId as string,
          userId: token.userId as string,
          accountId: token.accountId as string,
          accountName: token.accountName as string,
          accountEmail: token.accountEmail as string,
          walletAddress: token.walletAddress as string | undefined,
          authMethod: token.authMethod as 'siwe' | 'email-password',
          mfaRequired: token.mfaRequired as boolean,
          mfaSetupRequired: token.mfaSetupRequired as boolean,
          permissions: token.permissions as any[] || [],
        };
        
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
})

const handler = auth

export { handler as GET, handler as POST } 