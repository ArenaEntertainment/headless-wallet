import { type ReactNode } from 'react';
import { type MockWalletConfig } from '@arenaentertainment/wallet-mock';
export interface MockWalletProviderProps extends MockWalletConfig {
    children: ReactNode;
    enabled?: boolean;
}
/**
 * MockWalletProvider - Injects mock wallet providers into the browser
 *
 * This provider simply injects window.ethereum (and window.phantom.solana if configured)
 * so that standard wallet libraries like wagmi, ethers, viem, Reown AppKit, etc. can
 * detect and interact with the mock wallet just like a real wallet.
 *
 * @example
 * ```tsx
 * // In your app root
 * <MockWalletProvider
 *   enabled={process.env.NODE_ENV === 'development'}
 *   accounts={[{ privateKey: '0x...', type: 'evm' }]}
 * >
 *   <App />
 * </MockWalletProvider>
 *
 * // Then use standard wallet libraries
 * function MyComponent() {
 *   const { address } = useAccount(); // wagmi hook
 *   const { signMessage } = useSignMessage(); // wagmi hook
 *   // wallet-mock provides window.ethereum, wagmi handles the rest
 * }
 * ```
 */
export declare function MockWalletProvider({ children, enabled, accounts, ...walletConfig }: MockWalletProviderProps): import("react/jsx-runtime").JSX.Element;
