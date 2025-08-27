import { http, createConfig } from 'wagmi'
import {mainnet, polygon, polygonAmoy, sepolia} from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const IS_DEVELOPMENT =process.env.NEXT_PUBLIC_IS_DEVELOPMENT || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
export const INFURA_API_KEY =  process.env.INFURA_API_KEY || "bb46da3f80e040e8ab73c0a9ff365d18"
export const NETWORK = process.env.NEXT_PUBLIC_PROVIDER_CHAIN ? process.env.NEXT_PUBLIC_PROVIDER_CHAIN : IS_DEVELOPMENT ? "sepolia" : "mainnet";
export const IS_MAINNET = NETWORK === "mainnet";
export const NETWORK_NAME = IS_MAINNET ? "homestead" : NETWORK;
export const STABILITY_API_KEY = process.env.STABILITY_API_KEY || ""

export const wagmiConfig = createConfig({
    chains: [mainnet, sepolia, polygon, polygonAmoy],
    connectors:[metaMask()],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [polygonAmoy.id]: http(),

    },
})
