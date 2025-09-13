import { type ReactNode } from 'react';
import { type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
export interface HeadlessWalletProviderProps extends HeadlessWalletConfig {
    children: ReactNode;
    enabled?: boolean;
}
/**
 * HeadlessWalletProvider - Injects mock wallet providers into the browser
 *
 * This provider simply injects window.ethereum (and window.phantom.solana if configured)
 * so that standard wallet libraries like wagmi, ethers, viem, Reown AppKit, etc. can
 * detect and interact with the mock wallet just like a real wallet.
 *
 * @example
 * ```tsx
 * // In your app root
 * <HeadlessWalletProvider
 *   enabled={process.env.NODE_ENV === 'development'}
 *   accounts={[{ privateKey: '0x...', type: 'evm' }]}
 * >
 *   <App />
 * </HeadlessWalletProvider>
 *
 * // Then use standard wallet libraries
 * function MyComponent() {
 *   const { address } = useAccount(); // wagmi hook
 *   const { signMessage } = useSignMessage(); // wagmi hook
 *   // wallet-mock provides window.ethereum, wagmi handles the rest
 * }
 * ```
 */
export declare function HeadlessWalletProvider({ children, enabled, accounts, ...walletConfig }: HeadlessWalletProviderProps): import("react/jsx-runtime").JSX.Element;
