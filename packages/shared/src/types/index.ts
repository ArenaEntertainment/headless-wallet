// Account types
export type {
  BaseAccount,
  EVMAccountData,
  SolanaAccountData,
  EVMAccount,
  SolanaAccount,
  DualChainAccount,
  Account,
  AccountConfig,
  AccountEvents,
  ChainType
} from './account.js';

export { AccountType } from './account.js';

// Chain types
export type {
  Chain,
  EVMChain,
  SolanaCluster,
  SupportedChain,
  ChainEvents
} from './chain.js';

export { CHAIN_PRESETS } from './chain.js';

// Wallet types
export type {
  WalletState,
  WalletConfig,
  TransactionRequest,
  SignatureRequest,
  WalletEvents,
  EventEmitter,
  MockWallet,
  WalletFactory
} from './wallet.js';