import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet';
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
export function HeadlessWalletProvider({ children, enabled = process.env.NODE_ENV === 'development', accounts = [], ...walletConfig }) {
    // Inject immediately when component is created (not in useEffect)
    // This ensures the wallet is available before AppKit or other wallet libraries initialize
    if (enabled && typeof window !== 'undefined') {
        try {
            // Simply inject the mock wallet providers into the browser
            // This sets up window.ethereum (and window.phantom.solana if configured)
            // Standard wallet libraries will detect and use these providers
            injectHeadlessWallet({
                accounts,
                ...walletConfig
            });
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 Mock wallet injected for development');
            }
        }
        catch (error) {
            console.warn('Failed to inject mock wallet:', error);
        }
    }
    return _jsx(_Fragment, { children: children });
}
