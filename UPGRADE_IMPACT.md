# Upgrade Impact: Major Version Updates (pnpm outdated)

This document summarizes the impact of updating the packages that are at least a major version behind (from `pnpm outdated`, lines 176–183).

---

## 1. **@types/node** (20.19.1 → 25.1.0)

| Aspect | Impact |
|--------|--------|
| **Risk** | Low |
| **Scope** | Dev-only type definitions |
| **Code changes** | None required. Update may surface new or stricter types if your code uses Node APIs that changed between Node 20 and 25. |
| **Action** | Bump to `^25` in `devDependencies`. Run `pnpm build` and fix any new type errors. |

---

## 2. **next** (15.3.4 → 16.1.6) and **eslint-config-next** (15.3.4 → 16.1.6)

Upgrade **next** and **eslint-config-next** together (eslint-config-next is version-locked to Next).

### Impact summary

| Area | Status in your codebase | Action |
|------|---------------------------|--------|
| **Async Request APIs** | Already compatible | `searchParams` and `params` are already `Promise<>` and awaited (e.g. `customer-accounts/page.tsx`, `customer-accounts/[id]/page.tsx`, `onboarding/[id]/page.tsx`, `deal-desk/deal/[id]/page.tsx`). No change needed. |
| **cookies()** | Already awaited | Used as `await cookies()` in `nextauth.actions.ts`, `api-client.ts`, `rbac/server-actions.ts`. OK for Next 16. |
| **Turbopack** | Explicit flag used | Next 16 uses Turbopack by default. Remove `--turbopack` from `package.json` scripts (`dev`, and `build` if present). |
| **middleware → proxy** | Uses `middleware.ts` | Next 16 deprecates `middleware` in favor of `proxy`. You can either rename `middleware.ts` → `proxy.ts` and export `proxy` instead of `middleware`, or keep `middleware` if you rely on the Edge runtime (proxy uses Node). Run codemod or do manually. |
| **next lint** | Used in scripts | Next 16 removes `next lint`. Use ESLint directly (e.g. `eslint .`). Codemod: `npx @next/codemod@canary next-lint-to-eslint-cli`. |
| **next.config** | No experimental turbopack | If you later add Turbopack config, move from `experimental.turbopack` to top-level `turbopack`. |
| **Node / TS / browsers** | Check environment | Node 20.9+, TypeScript 5.1+, and updated browser support are required. |

### Recommended steps

1. **Upgrade**
   - `pnpm add next@16 eslint-config-next@16`
   - Upgrade React with Next: `pnpm add react@latest react-dom@latest` (and `@types/react` / `@types/react-dom` if used).
2. **Scripts** (`package.json`)
   - Remove `--turbopack` from `dev` (and `build` if present).
   - Replace `next lint` with direct ESLint (after running codemod if desired).
3. **Middleware**
   - Run `npx @next/codemod@canary upgrade latest` and/or rename `middleware.ts` → `proxy.ts` and export `proxy` if you are not depending on Edge.
4. **Optional**
   - Run `npx next typegen` for async `params`/`searchParams` types.

---

## 3. **wagmi** (2.15.6 → 3.4.1)

Wagmi v3 is a major upgrade with breaking API and dependency changes.

### Where wagmi is used

| File | Usage |
|------|--------|
| `src/config/web3-config.ts` | `createConfig`, `http`, `wagmi/chains`, `wagmi/connectors` (metaMask) |
| `src/lib/wagmi.ts` | `createConfig`, `http`, `wagmi/chains`, `wagmi/connectors` (injected, metaMask) |
| `src/app/providers.tsx` | `State`, `WagmiProvider`, `wagmiConfig` |
| `src/components/auth/siwe-login.tsx` | `useAccount`, `useConnect`, `useSignMessage`, `useDisconnect`; `connectors`, `connect({ connector, chainId })` |
| `src/components/deal-desk/promissory-note-signer.tsx` | `useAccount`, `useConnect`, `useDisconnect`, `useChainId`, `useSwitchChain`, `useWalletClient`; `injected` connector; `connect({...})`, `switchChain({ chainId })` |

### Breaking changes and required updates

1. **Connector dependencies (required)**  
   Connectors are no longer bundled. You must install:
   - **metaMask**: `pnpm add @metamask/sdk@~0.33.1`
   - **injected** (browser): no extra package; keep using `injected()` from `wagmi/connectors`.

2. **Renamed hooks**
   - `useAccount` → `useConnection` (and account-related data may live under the connection).
   - `useAccountEffect` → `useConnectionEffect`, `useSwitchAccount` → `useSwitchConnection`.  
   Your code uses `useAccount` and `useSwitchChain` (not `useSwitchAccount`), so you’ll need to:
   - Replace `useAccount` with `useConnection` and update any destructuring (e.g. `address`, `isConnected`).
   - Keep using `useSwitchChain` but adapt to v3 API (e.g. `mutate` instead of `switchChain` if that’s how it’s exposed).

3. **useConnect()**
   - **v2:** `const { connectors, connect } = useConnect(); connect({ connector, chainId });`
   - **v3:** `connectors` removed from `useConnect()`. Use `useConnectors()` for the list. Connect is done via `mutate`/`mutateAsync` (e.g. `connect.mutate({ connector, chainId })`).

4. **useDisconnect()**
   - **v2:** `const { disconnect } = useDisconnect();`
   - **v3:** Same hook but disconnect action may be `mutate`/`mutateAsync`. Check v3 docs and update calls (e.g. `disconnect.mutate()`).

5. **useSwitchChain()**
   - **v3:** `useSwitchChain().chains` removed. Use `useChains()` when you need the chains list. Switch action may be `mutate`/`mutateAsync` (e.g. `switchChain.mutate({ chainId })`).

6. **WagmiProvider / createConfig**
   - `createConfig` and `WagmiProvider` remain but options may differ. Check v3 migration guide for `State` (e.g. rehydration) and any renamed or removed props.

7. **TypeScript**
   - Wagmi v3 targets TS 5.7.3+. Your project is on TS 5.8.3, so you’re fine.

### Files to update for Wagmi v3

- `src/app/providers.tsx` – `State` and `WagmiProvider` usage.
- `src/config/web3-config.ts` – no API change expected; ensure metaMask connector still works after adding `@metamask/sdk`.
- `src/lib/wagmi.ts` – same; `injected` + metaMask.
- `src/components/auth/siwe-login.tsx` – `useAccount` → `useConnection`, `useConnect` → `useConnectors` + `useConnect().mutate`, `useDisconnect` → confirm API (e.g. `mutate`).
- `src/components/deal-desk/promissory-note-signer.tsx` – same hook renames and `connect`/`switchChain`/`disconnect` → `mutate`/`mutateAsync` where applicable.

Reference: [Wagmi v2 → v3 migration](https://wagmi.sh/react/guides/migrate-from-v2-to-v3).

---

## 4. **lucide-react** (0.518.0 → 0.563.0)

| Aspect | Impact |
|--------|--------|
| **Risk** | Very low |
| **Scope** | Icon component library; same major (0.x), minor/patch bump. |
| **Code changes** | None expected. Icon names and props are stable. Used in many components (sidebar, auth, deal-desk, tables, etc.). |
| **Action** | Bump to latest 0.x (e.g. `^0.563.0`). Run build and quick UI check. |

---

## Suggested order of upgrades

1. **Low risk, no code changes**
   - `@types/node` to ^25
   - `lucide-react` to latest 0.x

2. **Next 16**
   - Upgrade `next` and `eslint-config-next`, adjust scripts and middleware/proxy, then run build and tests.

3. **Wagmi v3**
   - Add `@metamask/sdk`, upgrade `wagmi` to v3, then update providers and all components that use wagmi hooks/connectors as above.

Doing Next 16 first is recommended so that lint and Turbopack defaults are aligned before touching wagmi.
