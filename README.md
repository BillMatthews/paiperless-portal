This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

# ToDo:
1. Need to integrate authentication
    * SIWE
2. Authorisation - Future?
    * Add guards to features to ensure only specific users can access features.
3. Deal Desk
   * Decision tab is not displaying the list of decisions
   * Promissory Note: Signing
     * Need a Block Explorer link for the signing event - we may need to store additional information such as the transaction
   * Funding Progress tracker
4. Account User Management
   * Add feature to manage Account Users for the Voy Account
5. Future -> Checklist Management
6. Future -> Manage Application API keys   Generate new Keys
