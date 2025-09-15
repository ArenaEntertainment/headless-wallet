import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet } from '@reown/appkit/networks'

export const projectId = '5f0684182dbf5c228f863711c8f499ac'

export const networks = [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet]

export const ethersAdapter = new EthersAdapter({
  projectId,
  networks
})

// SolanaAdapter auto-detects wallet-standard wallets
export const solanaAdapter = new SolanaAdapter()