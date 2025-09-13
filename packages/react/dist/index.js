import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { createContext, useRef, useState, useEffect, useCallback, useSyncExternalStore, useMemo, useContext } from "react";
import { createProductionGuard, createWallet } from "@arenaentertainment/wallet-mock";
const defaultContextValue = {
  // State
  wallet: null,
  state: null,
  isConnected: false,
  accounts: [],
  currentAccount: null,
  currentChain: null,
  availableChains: [],
  isConnecting: false,
  error: null,
  isInitialised: false,
  // Actions
  connect: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  disconnect: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  switchAccount: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  switchChain: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  addAccount: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  removeAccount: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  refresh: async () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  },
  clearError: () => {
    throw new Error("MockWalletProvider not found. Wrap your app with <MockWalletProvider>");
  }
};
const WalletContext = createContext(defaultContextValue);
WalletContext.displayName = "MockWalletContext";
const PRODUCTION_WARNING = `
🚨 MockWallet Warning: You are using a mock wallet implementation.
This should NEVER be used in production environments.
Mock wallets are for development, testing, and demonstration purposes only.
`;
function MockWalletProvider({
  children,
  wallet: walletConfig,
  accounts: initialAccounts = [],
  initialChain,
  autoConnect = false,
  production,
  devMode = false,
  walletInstance: customWalletInstance
}) {
  const walletRef = useRef(null);
  const initalisedRef = useRef(false);
  const mountedRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined" && !devMode) {
      const guard = createProductionGuard(production);
      const result = guard.checkEnvironment();
      if (!result.isValid) {
        console.warn(PRODUCTION_WARNING);
        if (production?.throwInProduction) {
          throw new Error("Mock wallet cannot be used in production environment");
        }
      }
    }
  }, [production, devMode]);
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    async function initializeWallet() {
      try {
        const wallet = customWalletInstance || await createWallet({
          accounts: initialAccounts,
          ...walletConfig
        });
        if (!mounted) return;
        walletRef.current = wallet;
        if (initialChain && wallet.isConnected()) {
          try {
            await wallet.switchChain(initialChain.toString());
          } catch (chainError) {
            console.warn("Failed to switch to initial chain:", chainError);
          }
        }
        if (autoConnect && !wallet.isConnected()) {
          setIsConnecting(true);
          try {
            await wallet.connect();
          } catch (connectError) {
            console.warn("Auto-connect failed:", connectError);
            setError(connectError instanceof Error ? connectError : new Error("Auto-connect failed"));
          } finally {
            setIsConnecting(false);
          }
        }
        initalisedRef.current = true;
        forceUpdate({});
      } catch (initError) {
        if (mounted) {
          console.error("Failed to initialize wallet:", initError);
          setError(initError instanceof Error ? initError : new Error("Wallet initialization failed"));
        }
      }
    }
    initializeWallet();
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [customWalletInstance, walletConfig, initialAccounts, initialChain, autoConnect]);
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);
  const walletState = useSyncExternalStore(
    useCallback((onStoreChange) => {
      const wallet = walletRef.current;
      if (!wallet) return () => {
      };
      const handleStateChange = () => {
        onStoreChange();
      };
      wallet.on("connect", handleStateChange);
      wallet.on("disconnect", handleStateChange);
      wallet.on("accountsChanged", handleStateChange);
      wallet.on("chainChanged", handleStateChange);
      return () => {
        wallet.off("connect", handleStateChange);
        wallet.off("disconnect", handleStateChange);
        wallet.off("accountsChanged", handleStateChange);
        wallet.off("chainChanged", handleStateChange);
      };
    }, []),
    () => walletRef.current?.getState() || null,
    () => null
    // Server-side snapshot
  );
  const isConnected = walletState?.isConnected ?? false;
  const accounts = walletState?.accounts ?? [];
  const currentChain = walletState?.currentChain ?? null;
  const availableChains = walletState?.availableChains ?? [];
  const currentAccount = useMemo(() => {
    if (currentAccountId) {
      return accounts.find((acc) => acc.id === currentAccountId) || null;
    }
    return accounts[0] || null;
  }, [accounts, currentAccountId]);
  const connect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) {
      const connectError = new Error("Wallet not initialised");
      setError(connectError);
      throw connectError;
    }
    try {
      setIsConnecting(true);
      setError(null);
      await wallet.connect();
    } catch (connectError) {
      const error2 = connectError instanceof Error ? connectError : new Error("Connection failed");
      setError(error2);
      throw error2;
    } finally {
      setIsConnecting(false);
    }
  }, []);
  const disconnect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;
    try {
      setError(null);
      await wallet.disconnect();
      setCurrentAccountId(null);
    } catch (disconnectError) {
      const error2 = disconnectError instanceof Error ? disconnectError : new Error("Disconnection failed");
      setError(error2);
      throw error2;
    }
  }, []);
  const switchAccount = useCallback(async (accountId) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error("Wallet not initialised");
    }
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) {
      throw new Error(`Account with ID "${accountId}" not found`);
    }
    try {
      setError(null);
      await wallet.switchAccount(accountId);
      setCurrentAccountId(accountId);
    } catch (switchError) {
      const error2 = switchError instanceof Error ? switchError : new Error("Account switch failed");
      setError(error2);
      throw error2;
    }
  }, [accounts]);
  const switchChain = useCallback(async (chainId) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error("Wallet not initialised");
    }
    try {
      setError(null);
      await wallet.switchChain(chainId);
    } catch (switchError) {
      const error2 = switchError instanceof Error ? switchError : new Error("Chain switch failed");
      setError(error2);
      throw error2;
    }
  }, []);
  const addAccount = useCallback(async (config) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error("Wallet not initialised");
    }
    try {
      setError(null);
      const account = await wallet.addAccount(config);
      return account;
    } catch (addError) {
      const error2 = addError instanceof Error ? addError : new Error("Failed to add account");
      setError(error2);
      throw error2;
    }
  }, []);
  const removeAccount = useCallback(async (accountId) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error("Wallet not initialised");
    }
    try {
      setError(null);
      await wallet.removeAccount(accountId);
      if (currentAccountId === accountId) {
        setCurrentAccountId(null);
      }
    } catch (removeError) {
      const error2 = removeError instanceof Error ? removeError : new Error("Failed to remove account");
      setError(error2);
      throw error2;
    }
  }, [currentAccountId]);
  const refresh = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;
    try {
      setError(null);
      await wallet.refresh?.() || Promise.resolve();
      triggerUpdate();
    } catch (refreshError) {
      const error2 = refreshError instanceof Error ? refreshError : new Error("Refresh failed");
      setError(error2);
      throw error2;
    }
  }, [triggerUpdate]);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  const contextValue = useMemo(() => ({
    // State
    wallet: walletRef.current,
    state: walletState,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised: initalisedRef.current,
    // Actions
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  }), [
    walletState,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  ]);
  return /* @__PURE__ */ jsx(WalletContext.Provider, { value: contextValue, children });
}
function useWallet(options = {}) {
  const {
    throwOnError = false,
    autoConnect = false,
    onError,
    onConnect,
    onDisconnect
  } = options;
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a MockWalletProvider");
  }
  const {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised,
    connect: contextConnect,
    disconnect: contextDisconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  } = context;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useEffect(() => {
    if (autoConnect && isInitialised && !isConnected && !isConnecting && !error) {
      contextConnect().catch((connectError) => {
        console.warn("[useWallet] Auto-connect failed:", connectError);
      });
    }
  }, [autoConnect, isInitialised, isConnected, isConnecting, error, contextConnect]);
  useEffect(() => {
    if (error) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      if (errorHandler) {
        errorHandler(error);
      }
      if (shouldThrow) {
        throw error;
      }
    }
  }, [error]);
  useEffect(() => {
    const { onConnect: connectHandler } = optionsRef.current;
    if (isConnected && connectHandler && accounts.length > 0) {
      connectHandler(accounts);
    }
  }, [isConnected, accounts]);
  useEffect(() => {
    const { onDisconnect: disconnectHandler } = optionsRef.current;
    if (!isConnected && disconnectHandler) {
      disconnectHandler();
    }
  }, [isConnected]);
  const connect = useCallback(async () => {
    try {
      await contextConnect();
    } catch (connectError) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      const error2 = connectError instanceof Error ? connectError : new Error("Connection failed");
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
    }
  }, [contextConnect]);
  const disconnect = useCallback(async () => {
    try {
      await contextDisconnect();
    } catch (disconnectError) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      const error2 = disconnectError instanceof Error ? disconnectError : new Error("Disconnection failed");
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
    }
  }, [contextDisconnect]);
  const subscribe = useCallback((event, handler) => {
    if (!wallet) {
      console.warn("[useWallet] Wallet not available for event subscription:", event);
      return () => {
      };
    }
    wallet.on(event, handler);
    return () => {
      if (wallet) {
        wallet.off(event, handler);
      }
    };
  }, [wallet]);
  const once = useCallback((event, handler) => {
    if (!wallet) {
      console.warn("[useWallet] Wallet not available for one-time event:", event);
      return () => {
      };
    }
    const onceHandler = (data) => {
      handler(data);
      wallet.off(event, onceHandler);
    };
    wallet.on(event, onceHandler);
    return () => {
      if (wallet) {
        wallet.off(event, onceHandler);
      }
    };
  }, [wallet]);
  return {
    // State
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised,
    // Actions
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError,
    // Event utilities
    subscribe,
    once
  };
}
function useWalletConnection() {
  const { isConnected, isConnecting, error, connect, disconnect, clearError } = useWallet();
  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError
  };
}
function useWalletState() {
  const {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised
  } = useWallet();
  return {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised
  };
}
function useAccount(options = {}) {
  const {
    initialAccountId,
    autoSelect = false,
    throwOnError = false,
    onError,
    onConnect,
    onDisconnect
  } = options;
  const {
    accounts,
    currentAccount,
    switchAccount: walletSwitchAccount,
    addAccount: walletAddAccount,
    removeAccount: walletRemoveAccount,
    isConnected,
    isInitialised
  } = useWallet({ throwOnError, onError, onConnect, onDisconnect });
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || null
  );
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const account = useMemo(() => {
    if (selectedAccountId) {
      const foundAccount = accounts.find((acc) => acc.id === selectedAccountId);
      if (foundAccount) {
        return foundAccount;
      }
    }
    if (currentAccount) {
      return currentAccount;
    }
    if (autoSelect && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  }, [selectedAccountId, accounts, currentAccount, autoSelect]);
  useEffect(() => {
    if (initialAccountId && isInitialised && accounts.length > 0) {
      const initialAccount = accounts.find((acc) => acc.id === initialAccountId);
      if (initialAccount) {
        setSelectedAccountId(initialAccountId);
      }
    }
  }, [initialAccountId, isInitialised, accounts]);
  useEffect(() => {
    if (autoSelect && !selectedAccountId && accounts.length > 0 && isConnected && !isSwitching) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [autoSelect, selectedAccountId, accounts, isConnected, isSwitching]);
  const switchAccount = useCallback(async (accountId) => {
    const targetAccount = accounts.find((acc) => acc.id === accountId);
    if (!targetAccount) {
      const switchError = new Error(`Account with ID "${accountId}" not found`);
      setError(switchError);
      if (optionsRef.current.throwOnError) {
        throw switchError;
      }
      return;
    }
    try {
      setIsSwitching(true);
      setError(null);
      await walletSwitchAccount(accountId);
      setSelectedAccountId(accountId);
    } catch (switchError) {
      const error2 = switchError instanceof Error ? switchError : new Error("Account switch failed");
      setError(error2);
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
    } finally {
      setIsSwitching(false);
    }
  }, [accounts, walletSwitchAccount]);
  const addAccount = useCallback(async (config) => {
    try {
      setError(null);
      const newAccount = await walletAddAccount(config);
      if (!selectedAccountId && autoSelect) {
        setSelectedAccountId(newAccount.id);
      }
      return newAccount;
    } catch (addError) {
      const error2 = addError instanceof Error ? addError : new Error("Failed to add account");
      setError(error2);
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
      throw error2;
    }
  }, [walletAddAccount, selectedAccountId, autoSelect]);
  const removeAccount = useCallback(async (accountId) => {
    try {
      setError(null);
      await walletRemoveAccount(accountId);
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        if (autoSelect) {
          const remainingAccounts = accounts.filter((acc) => acc.id !== accountId);
          if (remainingAccounts.length > 0) {
            setSelectedAccountId(remainingAccounts[0].id);
          }
        }
      }
    } catch (removeError) {
      const error2 = removeError instanceof Error ? removeError : new Error("Failed to remove account");
      setError(error2);
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
    }
  }, [walletRemoveAccount, selectedAccountId, autoSelect, accounts]);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  return {
    account,
    accounts,
    switchAccount,
    addAccount,
    removeAccount,
    isSwitching,
    error,
    clearError
  };
}
function useAccountInfo() {
  const { account } = useAccount();
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!account) {
      setBalance(null);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const mockBalance = account.chainType === "evm" ? "1.23 ETH" : "4.56 SOL";
      setBalance(mockBalance);
      setIsLoading(false);
    }, 1e3);
    return () => clearTimeout(timer);
  }, [account]);
  return {
    account,
    balance,
    isLoading
  };
}
function useAccounts() {
  const { accounts } = useAccount();
  const evmAccounts = useMemo(
    () => accounts.filter((account) => account.chainType === "evm"),
    [accounts]
  );
  const solanaAccounts = useMemo(
    () => accounts.filter((account) => account.chainType === "solana"),
    [accounts]
  );
  const dualChainAccounts = useMemo(
    () => accounts.filter((account) => account.type === "dual_chain"),
    [accounts]
  );
  const accountsByChain = useMemo(() => {
    const grouped = {};
    accounts.forEach((account) => {
      const chainKey = account.chainType;
      if (!grouped[chainKey]) {
        grouped[chainKey] = [];
      }
      grouped[chainKey].push(account);
    });
    return grouped;
  }, [accounts]);
  return {
    accounts,
    evmAccounts,
    solanaAccounts,
    dualChainAccounts,
    accountsByChain
  };
}
function useChain(options = {}) {
  const {
    initialChainId,
    autoSelect = false,
    throwOnError = false,
    onError,
    onConnect,
    onDisconnect
  } = options;
  const {
    currentChain,
    availableChains,
    switchChain: walletSwitchChain,
    isConnected,
    isInitialised
  } = useWallet({ throwOnError, onError, onConnect, onDisconnect });
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChainId, setSelectedChainId] = useState(
    initialChainId || null
  );
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const chain = useMemo(() => {
    if (selectedChainId) {
      const foundChain = availableChains.find((c) => c.id === selectedChainId);
      if (foundChain) {
        return foundChain;
      }
    }
    if (currentChain) {
      return currentChain;
    }
    if (autoSelect && availableChains.length > 0) {
      return availableChains[0];
    }
    return null;
  }, [selectedChainId, availableChains, currentChain, autoSelect]);
  useEffect(() => {
    if (initialChainId && isInitialised && availableChains.length > 0) {
      const initialChain = availableChains.find((c) => c.id === initialChainId);
      if (initialChain) {
        setSelectedChainId(initialChainId);
      }
    }
  }, [initialChainId, isInitialised, availableChains]);
  useEffect(() => {
    if (autoSelect && !selectedChainId && availableChains.length > 0 && isConnected && !isSwitching) {
      setSelectedChainId(availableChains[0].id);
    }
  }, [autoSelect, selectedChainId, availableChains, isConnected, isSwitching]);
  const switchChain = useCallback(async (chainId) => {
    const targetChain = availableChains.find((c) => c.id === chainId);
    if (!targetChain) {
      const switchError = new Error(`Chain with ID "${chainId}" not found`);
      setError(switchError);
      if (optionsRef.current.throwOnError) {
        throw switchError;
      }
      return;
    }
    try {
      setIsSwitching(true);
      setError(null);
      await walletSwitchChain(chainId);
      setSelectedChainId(chainId);
    } catch (switchError) {
      const error2 = switchError instanceof Error ? switchError : new Error("Chain switch failed");
      setError(error2);
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      if (errorHandler) {
        errorHandler(error2);
      }
      if (shouldThrow) {
        throw error2;
      }
    } finally {
      setIsSwitching(false);
    }
  }, [availableChains, walletSwitchChain]);
  const isSupported = useCallback((chainId) => {
    return availableChains.some((chain2) => chain2.id === chainId);
  }, [availableChains]);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  return {
    chain,
    chains: availableChains,
    switchChain,
    isSwitching,
    error,
    clearError,
    isSupported
  };
}
function useChainInfo() {
  const { chain } = useChain();
  const isMainnet = useMemo(() => {
    if (!chain) return false;
    return chain.type === "evm" ? chain.id === "1" : chain.id === "mainnet-beta";
  }, [chain]);
  const isTestnet = useMemo(() => {
    if (!chain) return false;
    return !isMainnet;
  }, [isMainnet]);
  const nativeCurrency = useMemo(() => {
    if (!chain) return null;
    if (chain.type === "evm") {
      switch (chain.id) {
        case "1":
          return "ETH";
        case "137":
          return "MATIC";
        case "56":
          return "BNB";
        default:
          return "ETH";
      }
    } else {
      return "SOL";
    }
  }, [chain]);
  const explorerUrl = useMemo(() => {
    if (!chain) return null;
    if (chain.type === "evm") {
      switch (chain.id) {
        case "1":
          return "https://etherscan.io";
        case "137":
          return "https://polygonscan.com";
        case "56":
          return "https://bscscan.com";
        default:
          return null;
      }
    } else {
      switch (chain.id) {
        case "mainnet-beta":
          return "https://solscan.io";
        case "devnet":
          return "https://solscan.io?cluster=devnet";
        case "testnet":
          return "https://solscan.io?cluster=testnet";
        default:
          return null;
      }
    }
  }, [chain]);
  return {
    chain,
    isMainnet,
    isTestnet,
    nativeCurrency,
    explorerUrl
  };
}
function useChains() {
  const { chains } = useChain();
  const evmChains = useMemo(
    () => chains.filter((chain) => chain.type === "evm"),
    [chains]
  );
  const solanaChains = useMemo(
    () => chains.filter((chain) => chain.type === "solana"),
    [chains]
  );
  const mainnetChains = useMemo(
    () => chains.filter((chain) => {
      if (chain.type === "evm") {
        return chain.id === "1";
      } else {
        return chain.id === "mainnet-beta";
      }
    }),
    [chains]
  );
  const testnetChains = useMemo(
    () => chains.filter((chain) => {
      if (chain.type === "evm") {
        return chain.id !== "1";
      } else {
        return chain.id !== "mainnet-beta";
      }
    }),
    [chains]
  );
  return {
    chains,
    evmChains,
    solanaChains,
    mainnetChains,
    testnetChains
  };
}
function WalletConnectionButton({
  connectText = "Connect Wallet",
  disconnectText = "Disconnect",
  connectingText = "Connecting...",
  className = "",
  loadingClassName = "",
  disabledClassName = "",
  onConnect,
  onDisconnect,
  showStatus = false
}) {
  const {
    isConnected,
    isConnecting,
    error,
    accounts,
    connect,
    disconnect,
    clearError
  } = useWallet();
  const handleClick = async () => {
    clearError();
    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      await connect();
      if (isConnected) {
        onConnect?.();
      }
    }
  };
  const isDisabled = isConnecting;
  const buttonText = isConnecting ? connectingText : isConnected ? disconnectText : connectText;
  const buttonClassName = [
    className,
    isConnecting ? loadingClassName : "",
    isDisabled ? disabledClassName : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleClick,
        disabled: isDisabled,
        className: buttonClassName,
        type: "button",
        children: buttonText
      }
    ),
    showStatus && /* @__PURE__ */ jsxs("div", { children: [
      error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
        "Error: ",
        error.message
      ] }),
      isConnected && accounts.length > 0 && /* @__PURE__ */ jsxs("p", { style: { color: "green", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
        "Connected with ",
        accounts.length,
        " account",
        accounts.length !== 1 ? "s" : ""
      ] })
    ] })
  ] });
}
function WalletConnectionStatus({ className = "" }) {
  const { isConnected, isConnecting, accounts, currentAccount, error } = useWallet();
  if (isConnecting) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx("span", { children: "Connecting to wallet..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsxs("span", { style: { color: "red" }, children: [
      "Connection error: ",
      error.message
    ] }) });
  }
  if (!isConnected) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx("span", { children: "Wallet not connected" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { style: { color: "green" }, children: "✓ Connected" }),
      accounts.length > 0 && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "0.5rem" }, children: [
        "(",
        accounts.length,
        " account",
        accounts.length !== 1 ? "s" : "",
        ")"
      ] })
    ] }),
    currentAccount && /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }, children: [
      currentAccount.address.slice(0, 6),
      "...",
      currentAccount.address.slice(-4)
    ] })
  ] });
}
function WalletConnectionGuard({
  children,
  fallback = /* @__PURE__ */ jsx(WalletConnectionButton, { showStatus: true }),
  loading = /* @__PURE__ */ jsx("div", { children: "Connecting to wallet..." }),
  error: errorFallback
}) {
  const { isConnected, isConnecting, error } = useWallet();
  if (isConnecting) {
    return /* @__PURE__ */ jsx(Fragment, { children: loading });
  }
  if (error && errorFallback) {
    return /* @__PURE__ */ jsx(Fragment, { children: errorFallback });
  }
  if (!isConnected) {
    return /* @__PURE__ */ jsx(Fragment, { children: fallback });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function AccountSelector({
  renderAccount,
  className = "",
  selectedClassName = "",
  placeholder = "Select account...",
  onChange,
  showAddAccount = false
}) {
  const {
    account: currentAccount,
    accounts,
    switchAccount,
    addAccount,
    isSwitching,
    error
  } = useAccount();
  const handleAccountChange = async (accountId) => {
    if (accountId === "__add_new__") {
      try {
        const newAccount = await addAccount({ type: "evm" });
        onChange?.(newAccount);
      } catch (addError) {
        console.error("Failed to add account:", addError);
      }
      return;
    }
    const selectedAccount = accounts.find((acc) => acc.id === accountId);
    if (selectedAccount) {
      try {
        await switchAccount(accountId);
        onChange?.(selectedAccount);
      } catch (switchError) {
        console.error("Failed to switch account:", switchError);
      }
    }
  };
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs(
      "select",
      {
        value: currentAccount?.id || "",
        onChange: (e) => handleAccountChange(e.target.value),
        disabled: isSwitching,
        style: { minWidth: "200px" },
        children: [
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: placeholder }),
          accounts.map((account) => /* @__PURE__ */ jsxs("option", { value: account.id, children: [
            account.address.slice(0, 6),
            "...",
            account.address.slice(-4),
            " (",
            account.chainType,
            ")"
          ] }, account.id)),
          showAddAccount && /* @__PURE__ */ jsx("option", { value: "__add_new__", children: "+ Add New Account" })
        ]
      }
    ),
    error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
      "Error: ",
      error.message
    ] }),
    isSwitching && /* @__PURE__ */ jsx("p", { style: { fontSize: "0.875rem", marginTop: "0.5rem" }, children: "Switching account..." })
  ] });
}
function AccountList({
  onSelect,
  showActions = true,
  className = ""
}) {
  const {
    account: currentAccount,
    accounts,
    switchAccount,
    removeAccount,
    addAccount,
    isSwitching,
    error
  } = useAccount();
  const handleAddAccount = async (type) => {
    try {
      await addAccount({ type });
    } catch (addError) {
      console.error("Failed to add account:", addError);
    }
  };
  const handleRemoveAccount = async (accountId) => {
    if (accounts.length <= 1) {
      alert("Cannot remove the last account");
      return;
    }
    if (confirm("Are you sure you want to remove this account?")) {
      try {
        await removeAccount(accountId);
      } catch (removeError) {
        console.error("Failed to remove account:", removeError);
      }
    }
  };
  return /* @__PURE__ */ jsxs("div", { className, children: [
    accounts.length === 0 ? /* @__PURE__ */ jsx("p", { children: "No accounts available" }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: accounts.map((account) => {
      const isCurrent = currentAccount?.id === account.id;
      return /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "0.5rem",
            backgroundColor: isCurrent ? "#f0f8ff" : "transparent",
            cursor: "pointer"
          },
          onClick: () => {
            if (!isCurrent && !isSwitching) {
              switchAccount(account.id);
              onSelect?.(account);
            }
          },
          children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontFamily: "monospace", fontWeight: "bold" }, children: account.address }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.875rem", color: "#666" }, children: [
                "Chain: ",
                account.chainType,
                " • Type: ",
                account.type,
                isCurrent && " • Current"
              ] })
            ] }),
            showActions && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [
              !isCurrent && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    switchAccount(account.id);
                  },
                  disabled: isSwitching,
                  style: { padding: "0.25rem 0.5rem", fontSize: "0.75rem" },
                  children: "Select"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    handleRemoveAccount(account.id);
                  },
                  disabled: isSwitching || accounts.length <= 1,
                  style: {
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    color: "red"
                  },
                  children: "Remove"
                }
              )
            ] })
          ] })
        },
        account.id
      );
    }) }),
    showActions && /* @__PURE__ */ jsxs("div", { style: { marginTop: "1rem", display: "flex", gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleAddAccount("evm"),
          disabled: isSwitching,
          style: { padding: "0.5rem 1rem" },
          children: "+ Add EVM Account"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleAddAccount("solana"),
          disabled: isSwitching,
          style: { padding: "0.5rem 1rem" },
          children: "+ Add Solana Account"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
      "Error: ",
      error.message
    ] })
  ] });
}
function AccountInfo({
  showBalance = false,
  className = ""
}) {
  const { account } = useAccount();
  if (!account) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx("p", { children: "No account selected" }) });
  }
  return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Address:" }),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("code", { style: { fontSize: "0.875rem" }, children: account.address })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Chain Type:" }),
      " ",
      account.chainType
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Account Type:" }),
      " ",
      account.type
    ] }),
    account.publicKey && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Public Key:" }),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("code", { style: { fontSize: "0.875rem" }, children: account.publicKey })
    ] }),
    showBalance && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Balance:" }),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsxs("span", { style: { fontSize: "0.875rem" }, children: [
        account.chainType === "evm" ? "1.23 ETH" : "4.56 SOL",
        " (Mock)"
      ] })
    ] })
  ] }) });
}
function ChainSelector({
  renderChain,
  className = "",
  selectedClassName = "",
  placeholder = "Select chain...",
  onChange,
  filterChains
}) {
  const {
    chain: currentChain,
    chains: allChains,
    switchChain,
    isSwitching,
    error
  } = useChain();
  const chains = filterChains ? filterChains(allChains) : allChains;
  const handleChainChange = async (chainId) => {
    const selectedChain = chains.find((chain) => chain.id === chainId);
    if (selectedChain) {
      try {
        await switchChain(chainId);
        onChange?.(selectedChain);
      } catch (switchError) {
        console.error("Failed to switch chain:", switchError);
      }
    }
  };
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs(
      "select",
      {
        value: currentChain?.id || "",
        onChange: (e) => handleChainChange(e.target.value),
        disabled: isSwitching,
        style: { minWidth: "200px" },
        children: [
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: placeholder }),
          chains.map((chain) => /* @__PURE__ */ jsxs("option", { value: chain.id, children: [
            chain.name,
            " (",
            chain.type,
            ")"
          ] }, chain.id))
        ]
      }
    ),
    error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
      "Error: ",
      error.message
    ] }),
    isSwitching && /* @__PURE__ */ jsx("p", { style: { fontSize: "0.875rem", marginTop: "0.5rem" }, children: "Switching chain..." })
  ] });
}
function ChainList({
  onSelect,
  groupByType = false,
  className = ""
}) {
  const {
    chain: currentChain,
    chains,
    switchChain,
    isSwitching,
    error
  } = useChain();
  const handleChainSelect = async (chainId) => {
    const selectedChain = chains.find((chain) => chain.id === chainId);
    if (selectedChain && currentChain?.id !== chainId) {
      try {
        await switchChain(chainId);
        onSelect?.(selectedChain);
      } catch (switchError) {
        console.error("Failed to switch chain:", switchError);
      }
    }
  };
  const renderChainItem = (chain) => {
    const isCurrent = currentChain?.id === chain.id;
    return /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "0.5rem",
          backgroundColor: isCurrent ? "#f0f8ff" : "transparent",
          cursor: isCurrent ? "default" : "pointer"
        },
        onClick: () => {
          if (!isCurrent && !isSwitching) {
            handleChainSelect(chain.id);
          }
        },
        children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { style: { fontWeight: "bold" }, children: [
              chain.name,
              isCurrent && " • Current"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.875rem", color: "#666" }, children: [
              "Chain ID: ",
              chain.id,
              " • Type: ",
              chain.type
            ] })
          ] }),
          !isCurrent && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                handleChainSelect(chain.id);
              },
              disabled: isSwitching,
              style: { padding: "0.25rem 0.5rem", fontSize: "0.75rem" },
              children: "Select"
            }
          )
        ] })
      },
      chain.id
    );
  };
  if (chains.length === 0) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx("p", { children: "No chains available" }) });
  }
  if (groupByType) {
    const evmChains = chains.filter((chain) => chain.type === "evm");
    const solanaChains = chains.filter((chain) => chain.type === "solana");
    return /* @__PURE__ */ jsxs("div", { className, children: [
      evmChains.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "2rem" }, children: [
        /* @__PURE__ */ jsx("h3", { style: { marginBottom: "1rem" }, children: "EVM Chains" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: evmChains.map(renderChainItem) })
      ] }),
      solanaChains.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { style: { marginBottom: "1rem" }, children: "Solana Chains" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: solanaChains.map(renderChainItem) })
      ] }),
      error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
        "Error: ",
        error.message
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: chains.map(renderChainItem) }),
    error && /* @__PURE__ */ jsxs("p", { style: { color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }, children: [
      "Error: ",
      error.message
    ] })
  ] });
}
function ChainInfo({
  showExplorer = false,
  className = ""
}) {
  const { chain } = useChain();
  if (!chain) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx("p", { children: "No chain selected" }) });
  }
  const getChainDetails = (chain2) => {
    const isMainnet2 = chain2.type === "evm" ? chain2.id === "1" : chain2.id === "mainnet-beta";
    const nativeCurrency2 = chain2.type === "evm" ? chain2.id === "1" ? "ETH" : chain2.id === "137" ? "MATIC" : "ETH" : "SOL";
    const explorerUrl2 = chain2.type === "evm" ? chain2.id === "1" ? "https://etherscan.io" : chain2.id === "137" ? "https://polygonscan.com" : null : chain2.id === "mainnet-beta" ? "https://solscan.io" : `https://solscan.io?cluster=${chain2.id}`;
    return { isMainnet: isMainnet2, nativeCurrency: nativeCurrency2, explorerUrl: explorerUrl2 };
  };
  const { isMainnet, nativeCurrency, explorerUrl } = getChainDetails(chain);
  return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Name:" }),
      " ",
      chain.name
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Chain ID:" }),
      " ",
      chain.id
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Type:" }),
      " ",
      chain.type
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Network:" }),
      " ",
      isMainnet ? "Mainnet" : "Testnet"
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Native Currency:" }),
      " ",
      nativeCurrency
    ] }),
    showExplorer && explorerUrl && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Block Explorer:" }),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: explorerUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "#0066cc", textDecoration: "underline" },
          children: explorerUrl
        }
      )
    ] })
  ] }) });
}
function WalletStatus({
  showConnection = true,
  showAccount = true,
  showChain = true,
  showBalance = false,
  className = "",
  renderStatus
}) {
  const walletState = useWallet();
  const {
    isConnected,
    isConnecting,
    accounts,
    currentAccount,
    currentChain,
    error
  } = walletState;
  if (renderStatus) {
    return /* @__PURE__ */ jsx("div", { className, children: renderStatus(walletState) });
  }
  return /* @__PURE__ */ jsxs("div", { className, children: [
    showConnection && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem" }, children: [
      isConnecting ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "12px",
          height: "12px",
          backgroundColor: "#ffa500",
          borderRadius: "50%"
        } }),
        /* @__PURE__ */ jsx("span", { children: "Connecting..." })
      ] }) : isConnected ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "12px",
          height: "12px",
          backgroundColor: "#00c851",
          borderRadius: "50%"
        } }),
        /* @__PURE__ */ jsx("span", { children: "Connected" })
      ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "12px",
          height: "12px",
          backgroundColor: "#dc3545",
          borderRadius: "50%"
        } }),
        /* @__PURE__ */ jsx("span", { children: "Disconnected" })
      ] }),
      error && /* @__PURE__ */ jsx("div", { style: { fontSize: "0.75rem", color: "#dc3545", marginTop: "0.25rem" }, children: error.message })
    ] }),
    showAccount && isConnected && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem" }, children: [
      currentAccount ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "0.875rem", fontWeight: "bold" }, children: "Account" }),
        /* @__PURE__ */ jsxs("div", { style: {
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "#666"
        }, children: [
          currentAccount.address.slice(0, 6),
          "...",
          currentAccount.address.slice(-4)
        ] }),
        accounts.length > 1 && /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.75rem", color: "#888" }, children: [
          "(",
          accounts.length,
          " accounts total)"
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { style: { fontSize: "0.875rem", color: "#888" }, children: "No account selected" }),
      showBalance && currentAccount && /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }, children: [
        "Balance: ",
        currentAccount.chainType === "evm" ? "1.23 ETH" : "4.56 SOL",
        " (Mock)"
      ] })
    ] }),
    showChain && isConnected && currentChain && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "0.875rem", fontWeight: "bold" }, children: "Network" }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
        currentChain.name,
        " (",
        currentChain.type,
        ")"
      ] })
    ] })
  ] });
}
function WalletStatusBadge({ className = "" }) {
  const { isConnected, isConnecting, currentAccount, currentChain, error } = useWallet();
  if (isConnecting) {
    return /* @__PURE__ */ jsx("div", { className, style: {
      padding: "0.25rem 0.5rem",
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeaa7",
      borderRadius: "1rem",
      fontSize: "0.75rem"
    }, children: "Connecting..." });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className, style: {
      padding: "0.25rem 0.5rem",
      backgroundColor: "#f8d7da",
      border: "1px solid #f5c6cb",
      borderRadius: "1rem",
      fontSize: "0.75rem",
      color: "#721c24"
    }, children: "Error" });
  }
  if (!isConnected) {
    return /* @__PURE__ */ jsx("div", { className, style: {
      padding: "0.25rem 0.5rem",
      backgroundColor: "#f8f9fa",
      border: "1px solid #dee2e6",
      borderRadius: "1rem",
      fontSize: "0.75rem",
      color: "#6c757d"
    }, children: "Not Connected" });
  }
  return /* @__PURE__ */ jsx("div", { className, style: {
    padding: "0.25rem 0.5rem",
    backgroundColor: "#d1ecf1",
    border: "1px solid #b8daff",
    borderRadius: "1rem",
    fontSize: "0.75rem",
    color: "#0c5460"
  }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: "6px",
      height: "6px",
      backgroundColor: "#00c851",
      borderRadius: "50%"
    } }),
    /* @__PURE__ */ jsxs("span", { children: [
      currentAccount && /* @__PURE__ */ jsxs(Fragment, { children: [
        currentAccount.address.slice(0, 4),
        "...",
        currentAccount.address.slice(-2)
      ] }),
      currentChain && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "0.25rem", opacity: 0.8 }, children: [
        "• ",
        currentChain.name
      ] })
    ] })
  ] }) });
}
function WalletConnectionIndicator({
  size = "medium",
  showText = false,
  className = ""
}) {
  const { isConnected, isConnecting, error } = useWallet();
  const sizeMap = {
    small: "8px",
    medium: "12px",
    large: "16px"
  };
  const indicatorSize = sizeMap[size];
  const getStatus = () => {
    if (isConnecting) return { color: "#ffa500", text: "Connecting" };
    if (error) return { color: "#dc3545", text: "Error" };
    if (isConnected) return { color: "#00c851", text: "Connected" };
    return { color: "#6c757d", text: "Disconnected" };
  };
  const { color, text } = getStatus();
  return /* @__PURE__ */ jsxs("div", { className, style: {
    display: "flex",
    alignItems: "center",
    gap: showText ? "0.5rem" : "0"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: indicatorSize,
      height: indicatorSize,
      backgroundColor: color,
      borderRadius: "50%",
      transition: "background-color 0.2s ease"
    } }),
    showText && /* @__PURE__ */ jsx("span", { style: { fontSize: "0.875rem", color }, children: text })
  ] });
}
export {
  AccountInfo,
  AccountList,
  AccountSelector,
  ChainInfo,
  ChainList,
  ChainSelector,
  MockWalletProvider,
  WalletConnectionButton,
  WalletConnectionGuard,
  WalletConnectionIndicator,
  WalletConnectionStatus,
  WalletContext,
  WalletStatus,
  WalletStatusBadge,
  useAccount,
  useAccountInfo,
  useAccounts,
  useChain,
  useChainInfo,
  useChains,
  useWallet,
  useWalletConnection,
  useWalletState
};
