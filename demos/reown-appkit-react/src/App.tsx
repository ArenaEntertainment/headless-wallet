import { useState, useEffect } from 'react'
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useWalletInfo,
  useDisconnect
} from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import './App.css'

function App() {
  // AppKit hooks
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork, switchNetwork } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')
  const { walletProvider: solanaProvider } = useAppKitProvider('solana')
  const { selectedNetworkId } = useAppKitState()
  const { walletInfo } = useWalletInfo()
  const { disconnect } = useDisconnect()

  // Local state
  const [logs, setLogs] = useState<string[]>(['🎮 Arena Headless Wallet + Reown AppKit React Demo Initialized', '📡 Waiting for wallet connection...'])
  const [signature, setSignature] = useState('')
  const [txHash, setTxHash] = useState('')
  const [solanaResult, setSolanaResult] = useState('')
  const [capabilities, setCapabilities] = useState<any>(null)
  const [, forceUpdate] = useState(0)

  // Get active chain type
  const activeChain = selectedNetworkId?.includes('solana') ? 'solana' : 'eip155'

  // Get the headless wallet instance
  const wallet = typeof window !== 'undefined' ? (window as any).__headlessWallet : null

  // Helper functions
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearLogs = () => {
    setLogs(['✨ Logs cleared'])
  }

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    if (addr.length > 20) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    return addr
  }

  // Account switching handlers
  const switchToEVMAccount = async (index: number) => {
    if (wallet) {
      wallet.switchEVMAccount(index)
      addLog(`🔄 Switched to EVM account ${index}`)
      forceUpdate(prev => prev + 1)
    }
  }

  const switchToSolanaAccount = async (index: number) => {
    if (wallet) {
      wallet.switchSolanaAccount(index)
      addLog(`🔄 Switched to Solana account ${index}`)
      forceUpdate(prev => prev + 1)
    }
  }

  // Disconnect handler
  const handleDisconnect = async () => {
    try {
      await disconnect()
      addLog('✅ AppKit disconnected')
      setSignature('')
      setTxHash('')
      setSolanaResult('')
    } catch (error) {
      addLog(`❌ Disconnect failed: ${error}`)
    }
  }

  // Network switching
  const switchToEthereum = async () => {
    try {
      await switchNetwork({ id: 'eip155:11155111' }) // Sepolia
      addLog('🔄 Switched to Sepolia testnet')
    } catch (error) {
      addLog(`❌ Failed to switch network: ${error}`)
    }
  }

  const switchToPolygon = async () => {
    try {
      await switchNetwork({ id: 'eip155:80002' }) // Polygon Amoy
      addLog('🔄 Switched to Polygon Amoy testnet')
    } catch (error) {
      addLog(`❌ Failed to switch network: ${error}`)
    }
  }

  // Get wallet capabilities
  const getCapabilities = async () => {
    try {
      if (walletProvider) {
        const caps = await walletProvider.request({ method: 'wallet_getCapabilities' })
        setCapabilities(caps)
        addLog(`📋 Wallet capabilities: ${JSON.stringify(caps)}`)
      }
    } catch (error) {
      addLog(`❌ Failed to get capabilities: ${error}`)
    }
  }

  // Signing functions
  const signMessage = async () => {
    try {
      setSignature('')

      if (activeChain === 'solana' && solanaProvider) {
        // Solana signing
        const message = new TextEncoder().encode('Hello from React + AppKit!')
        const result = await solanaProvider.signMessage(message)
        setSignature(Buffer.from(result.signature).toString('hex'))
        addLog('✅ Solana message signed')
      } else if (walletProvider) {
        // EVM signing
        const provider = new BrowserProvider(walletProvider)
        const signer = await provider.getSigner()
        const result = await signer.signMessage('Hello from React + AppKit!')
        setSignature(result)
        addLog('✅ EVM message signed')
      }
    } catch (error) {
      addLog(`❌ Signing failed: ${error}`)
    }
  }

  const signTypedData = async () => {
    if (activeChain === 'solana' || !walletProvider) return

    try {
      setSignature('')
      const provider = new BrowserProvider(walletProvider)
      const signer = await provider.getSigner()

      const domain = {
        name: 'Arena Headless Wallet',
        version: '1',
        chainId: 11155111, // Sepolia
        verifyingContract: '0x0000000000000000000000000000000000000000'
      }

      const types = {
        Message: [
          { name: 'content', type: 'string' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }

      const value = {
        content: 'Hello from React + AppKit typed data!',
        timestamp: Math.floor(Date.now() / 1000)
      }

      const result = await signer.signTypedData(domain, types, value)
      setSignature(result)
      addLog('✅ Typed data signed')
    } catch (error) {
      addLog(`❌ Typed data signing failed: ${error}`)
    }
  }

  // EVM Transaction function
  const sendTransaction = async () => {
    try {
      setTxHash('')
      addLog('📤 Preparing EVM transaction...')

      if (walletProvider) {
        const provider = new BrowserProvider(walletProvider)
        const signer = await provider.getSigner()

        const tx = await signer.sendTransaction({
          to: address,
          value: '0x0'
        })

        setTxHash(tx.hash)
        addLog(`✅ EVM transaction sent: ${tx.hash}`)
      }
    } catch (error: any) {
      setTxHash('')
      addLog(`❌ Transaction failed: ${error.message || error}`)
    }
  }

  // Solana functions
  const signSolanaMessage = async () => {
    try {
      if (solanaProvider) {
        const message = new TextEncoder().encode('Hello from React + AppKit on Solana!')
        const result = await solanaProvider.signMessage(message)
        setSolanaResult(`Signed: ${Buffer.from(result.signature).toString('hex').substring(0, 20)}...`)
        addLog('✅ Solana message signed')
      }
    } catch (error) {
      addLog(`❌ Solana signing failed: ${error}`)
    }
  }

  const sendSolanaTransaction = async () => {
    try {
      setSolanaResult('')
      addLog('📤 Preparing Solana transaction...')

      if (solanaProvider && address) {
        // Use devnet for testing
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        const fromPubkey = new PublicKey(address)
        const toPubkey = new PublicKey(address) // Send to self for demo

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1000 // 0.000001 SOL
          })
        )

        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPubkey

        addLog('📡 Signing and sending Solana transaction...')
        const signedTx = await solanaProvider.signTransaction(transaction)
        const serialized = signedTx.serialize()
        const txId = await connection.sendRawTransaction(serialized)

        setSolanaResult(`Transaction sent: ${txId.substring(0, 20)}...`)
        addLog(`✅ Solana transaction sent: ${txId}`)
      }
    } catch (error: any) {
      setSolanaResult('')
      addLog(`❌ Solana transaction failed: ${error.message || error}`)
    }
  }

  // Disconnect handlers for wallet UI
  const disconnectEVM = async () => {
    try {
      if (walletProvider && walletProvider.disconnect) {
        await walletProvider.disconnect()
        addLog('✅ EVM disconnected from wallet UI')
      }
    } catch (error) {
      addLog(`❌ EVM disconnect failed: ${error}`)
    }
  }

  const disconnectSolana = async () => {
    try {
      if (solanaProvider && solanaProvider.disconnect) {
        await solanaProvider.disconnect()
        addLog('✅ Solana disconnected from wallet UI')
      }
    } catch (error) {
      addLog(`❌ Solana disconnect failed: ${error}`)
    }
  }

  // Log connection changes
  useEffect(() => {
    if (isConnected && address) {
      addLog(`✅ Wallet connected: ${formatAddress(address)}`)
    }
  }, [isConnected, address])

  return (
    <div className="demo-container">
      <div className="framework-badge">React + TypeScript</div>
      <header className="header">
        <h1>🎮 Arena Headless Wallet + Reown AppKit</h1>
        <p className="subtitle">
          Demonstrating seamless integration between Arena's mock wallet and Reown's AppKit for Web3 development
        </p>
      </header>

      {/* Info Box */}
      <div className="info-box">
        <h3>🎯 What This Demo Shows</h3>
        <ul>
          <li>EIP-6963 wallet discovery - AppKit automatically detects our mock wallet</li>
          <li>Real cryptographic operations using ethers.js with actual private keys</li>
          <li>Multi-chain support with EVM (Sepolia, Polygon Amoy) and Solana (Devnet)</li>
          <li>Standard wallet operations (connect, sign, send transactions)</li>
          <li>Chain switching functionality</li>
        </ul>
      </div>

      {/* Connection Status */}
      <div className="card">
        <h2>🔗 Connection Status</h2>
        <div className="connection-section">
          <div className="status-display">
            <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? (activeChain === 'solana' ? 'Solana Connected' : 'EVM Connected') : 'Disconnected'}
            </span>
          </div>
          <div className="demo-actions">
            <appkit-button />
            <appkit-network-button />
            {isConnected && (
              <button onClick={handleDisconnect} style={{ background: '#dc3545' }}>
                Disconnect AppKit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      {isConnected && (
        <div className="card">
          <h2>👤 Account Information</h2>
          <div className="wallet-info">
            {address && (
              <div>
                <h4>{activeChain === 'solana' ? 'Solana Accounts' : 'EVM Accounts'}</h4>
                <div className="code">Current: {formatAddress(address)}</div>
                <div style={{ marginTop: '1rem' }}>
                  {activeChain === 'solana' && wallet?.getSolanaAccountInfo && (() => {
                    const info = wallet.getSolanaAccountInfo()
                    if (!info) return null
                    return (
                      <div>
                        <strong>All Accounts (click to switch):</strong>
                        {info.accounts.map((acc: string, index: number) => {
                          const isActive = index === info.currentIndex
                          return (
                            <div
                              key={index}
                              onClick={() => switchToSolanaAccount(index)}
                              className={`account-item ${isActive ? 'active' : ''}`}
                            >
                              {isActive ? '▶ ' : '  '}{formatAddress(acc)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {activeChain === 'eip155' && wallet?.getEVMAccountInfo && (() => {
                    const info = wallet.getEVMAccountInfo()
                    if (!info) return null
                    return (
                      <div>
                        <strong>All Accounts (click to switch):</strong>
                        {info.accounts.map((acc: string, index: number) => {
                          const isActive = index === info.currentIndex
                          return (
                            <div
                              key={index}
                              onClick={() => switchToEVMAccount(index)}
                              className={`account-item ${isActive ? 'active' : ''}`}
                            >
                              {isActive ? '▶ ' : '  '}{formatAddress(acc)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Information */}
      {isConnected && (
        <div className="card">
          <h2>🌐 Network Information</h2>
          <div className="info-box">
            <h4>Active Chain</h4>
            <div className="code">{caipNetwork?.name || 'Unknown'}</div>
          </div>
          <div className="demo-actions">
            <button onClick={switchToPolygon} disabled={!isConnected || activeChain !== 'eip155'}>
              Switch to Polygon Amoy
            </button>
            <button onClick={switchToEthereum} disabled={!isConnected || activeChain !== 'eip155'}>
              Switch to Sepolia
            </button>
            <button onClick={getCapabilities} disabled={!isConnected}>
              Get Wallet Capabilities
            </button>
          </div>
        </div>
      )}

      {/* Signing Demo */}
      {isConnected && (
        <div className="card">
          <h2>✍️ Signing Demo</h2>
          <div className="demo-actions">
            <button onClick={signMessage} disabled={!isConnected}>
              {activeChain === 'solana' ? 'Sign Solana Message' : 'Sign EVM Message'}
            </button>
            <button onClick={signTypedData} disabled={!isConnected || activeChain === 'solana'}>
              Sign Typed Data (EVM)
            </button>
          </div>
          {signature && (
            <div className="signature-result">
              <h4>Signature Result:</h4>
              <div className="code">{signature}</div>
            </div>
          )}
          {capabilities && (
            <div className="info-box">
              <h4>Wallet Capabilities:</h4>
              <div className="code">{JSON.stringify(capabilities, null, 2)}</div>
            </div>
          )}
        </div>
      )}

      {/* EVM Transaction Demo */}
      {isConnected && activeChain === 'eip155' && (
        <div className="card">
          <h2>💸 EVM Transaction Demo</h2>
          <div className="demo-actions">
            <button onClick={sendTransaction} disabled={!isConnected}>
              Send Test Transaction
            </button>
            <button onClick={disconnectEVM} disabled={!isConnected}>
              Disconnect EVM (from wallet UI)
            </button>
          </div>
          {txHash && (
            <div className="tx-result success">
              <h4>✅ Transaction Sent Successfully</h4>
              <div className="code">{txHash}</div>
              <p>Sent 0 ETH to self (test transaction)</p>
            </div>
          )}
        </div>
      )}

      {/* Solana Transaction Demo */}
      {isConnected && activeChain === 'solana' && (
        <div className="card">
          <h2>🟣 Solana Transaction Demo</h2>
          <div className="demo-actions">
            <button onClick={signSolanaMessage} disabled={!isConnected}>
              Sign Solana Message
            </button>
            <button onClick={sendSolanaTransaction} disabled={!isConnected}>
              Send Solana Transaction
            </button>
            <button onClick={disconnectSolana} disabled={!isConnected}>
              Disconnect Solana (from wallet UI)
            </button>
          </div>
          {solanaResult && (
            <div className="solana-result">
              <div className="code">{solanaResult}</div>
            </div>
          )}
        </div>
      )}

      {/* Feature Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="icon">🔍</div>
          <h3>EIP-6963 Discovery</h3>
          <p>Automatic wallet detection through standard protocol</p>
        </div>
        <div className="feature-card">
          <div className="icon">🔐</div>
          <h3>Real Cryptography</h3>
          <p>Actual private key operations, not fake signatures</p>
        </div>
        <div className="feature-card">
          <div className="icon">🌍</div>
          <h3>Multi-Chain Support</h3>
          <p>Switch between networks seamlessly</p>
        </div>
        <div className="feature-card">
          <div className="icon">⚡</div>
          <h3>Standards Compliant</h3>
          <p>Follows EIP-1193, EIP-6963, and other standards</p>
        </div>
      </div>

      {/* Event Logs */}
      <div className="card">
        <h2>📊 Event Logs</h2>
        <button onClick={clearLogs} className="clear-btn">Clear Logs</button>
        <div className="logs">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App