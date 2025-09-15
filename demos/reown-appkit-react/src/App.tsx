import { useState } from 'react'
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
  const { address, isConnected, caipAddress } = useAppKitAccount()
  const { caipNetwork, switchNetwork } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')
  const { walletProvider: solanaProvider } = useAppKitProvider('solana')
  const { open, selectedNetworkId } = useAppKitState()
  const { walletInfo } = useWalletInfo()
  const { disconnect } = useDisconnect()

  // Local state
  const [logs, setLogs] = useState<string[]>(['🎮 Arena Headless Wallet + Reown AppKit React Demo Initialized'])
  const [signature, setSignature] = useState('')
  const [txHash, setTxHash] = useState('')


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

  // Get active chain type
  const activeChain = selectedNetworkId?.includes('solana') ? 'solana' : 'eip155'

  // Disconnect handler
  const handleDisconnect = async () => {
    try {
      await disconnect()
      addLog('✅ AppKit disconnected')
      setSignature('')
      setTxHash('')
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

  // Transaction function
  const sendTransaction = async () => {
    try {
      setTxHash('')
      addLog('📤 Preparing transaction...')

      if (activeChain === 'solana' && solanaProvider) {
        // Solana transaction
        try {
          // Use devnet for testing
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
          const fromPubkey = new PublicKey(address!)
          const toPubkey = new PublicKey(address!) // Send to self for demo

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

          setTxHash(txId)
          addLog(`✅ Solana transaction sent: ${txId}`)
        } catch (solanaError: any) {
          throw solanaError
        }
      } else if (walletProvider) {
        // EVM transaction
        addLog('📤 Sending EVM transaction...')
        const provider = new BrowserProvider(walletProvider)
        const signer = await provider.getSigner()

        const tx = await signer.sendTransaction({
          to: address,
          value: '0x0'
        })

        setTxHash(tx.hash)
        addLog(`✅ EVM transaction sent: ${tx.hash}`)
      } else {
        throw new Error('No wallet provider available')
      }
    } catch (error: any) {
      setTxHash('')
      addLog(`❌ Transaction failed: ${error.message || error}`)
    }
  }

  return (
    <div className="demo-container">
      <div className="framework-badge">React + TypeScript</div>
      <header className="header">
        <h1>🎮 Arena Headless Wallet + Reown AppKit</h1>
        <p>Demonstrating seamless integration between Arena's mock wallet and Reown's AppKit for Web3 development</p>
      </header>

      {/* AppKit Connection Button */}
      <div className="card">
        <h2>🔗 Connection</h2>
        <div className="connection-section">
          <appkit-button />
          <div className="status-display">
            <span className={`status ${isConnected ? 'connected' : ''}`}>
              {isConnected ? (activeChain === 'solana' ? 'Solana Connected' : 'EVM Connected') : 'Disconnected'}
            </span>
          </div>
          {isConnected && (
            <button onClick={handleDisconnect} style={{ background: '#dc3545', marginTop: '1rem' }}>
              Disconnect AppKit
            </button>
          )}
        </div>
      </div>

      {/* AppKit Components */}
      <div className="card">
        <h2>📊 Components</h2>
        <div className="button-group">
          <appkit-connect-button />
          <appkit-account-button />
          <appkit-network-button />
        </div>
      </div>

      {/* Account Information */}
      {isConnected && (
        <div className="card">
          <h2>👤 Account Information</h2>
          <div className="info-box">
            {address && (
              <div>
                <h4>{activeChain === 'solana' ? 'Solana Account' : 'EVM Account'}</h4>
                <div className="code">{formatAddress(address)}</div>
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
            <div className="network-switch">
              <button onClick={switchToEthereum} disabled={!isConnected || activeChain !== 'eip155'}>
                Switch to Sepolia
              </button>
              <button onClick={switchToPolygon} disabled={!isConnected || activeChain !== 'eip155'}>
                Switch to Polygon Amoy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signing Demo */}
      {isConnected && (
        <div className="card">
          <h2>✍️ Signing Demo</h2>
          <div className="button-group">
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
        </div>
      )}

      {/* Transaction Demo */}
      {isConnected && (
        <div className="card">
          <h2>💸 Transaction Demo</h2>
          <button onClick={sendTransaction} disabled={!isConnected}>
            Send Test Transaction
          </button>
          {txHash && (
            <div className="tx-result" style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <h4 style={{ color: '#155724' }}>✅ Transaction Sent Successfully</h4>
              <div className="code">{txHash}</div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#155724' }}>
                {activeChain === 'solana'
                  ? 'Sent 0.000001 SOL to self on Solana Devnet'
                  : 'Sent 0 ETH to self (test transaction)'}
              </p>
            </div>
          )}
        </div>
      )}

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