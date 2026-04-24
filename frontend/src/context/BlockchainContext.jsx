import { createContext, useContext, useState, useCallback } from 'react'
import { ethers } from 'ethers'

const BlockchainContext = createContext(null)

// ABI — only the functions we call from the frontend
const CONTRACT_ABI = [
  "function selfRegister(uint8 role, string name) external",
  "function createBatch(string batchId, string herbName, string herbLatin, uint256 quantityGrams, int256 latE6, int256 lngE6, string locationName, string notes, string photoHash) external",
  "function logEvent(string batchId, uint8 nodeType, int256 latE6, int256 lngE6, string locationName, string notes, string photoHash) external",
  "function getBatch(string batchId) external view returns (string,string,uint256,uint8,uint8,address,uint256,uint256)",
  "function getEventCount(string batchId) external view returns (uint256)",
  "function getEvent(string batchId, uint256 index) external view returns (uint8,address,string,int256,int256,string,string,string,uint256,uint256)",
  "function getAllBatchIds() external view returns (string[])",
  "function getStats() external view returns (uint256,uint256)",
  "function roles(address) external view returns (uint8)",
  "function actorNames(address) external view returns (string)",
  "event BatchCreated(string batchId, string herbName, address collector, uint256 timestamp)",
  "event EventLogged(string batchId, uint8 nodeType, address actor, uint256 timestamp)"
]

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 80002) // Polygon Amoy

const ROLE_NAMES = {
  0: 'none', 1: 'collector', 2: 'aggregator',
  3: 'processor', 4: 'manufacturer', 5: 'admin'
}

export function BlockchainProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not found! Please install MetaMask extension.')
      return null
    }
    setConnecting(true)
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      await web3Provider.send('eth_requestAccounts', [])
      const web3Signer = await web3Provider.getSigner()
      const address = await web3Signer.getAddress()
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(address)
      setChainId(Number(network.chainId))

      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== 'paste_after_deploy') {
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer)
        setContract(c)
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) disconnectWallet()
        else window.location.reload()
      })
      window.ethereum.on('chainChanged', () => window.location.reload())

      return { address, network }
    } catch (err) {
      console.error('Connect wallet error:', err)
      return null
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setChainId(null)
  }, [])

  // Sign a message to prove wallet ownership (for login)
  const signMessage = useCallback(async (message) => {
    if (!signer) throw new Error('Wallet not connected')
    return await signer.signMessage(message)
  }, [signer])

  // Check if on correct network
  const isCorrectNetwork = chainId === CHAIN_ID || chainId === 31337 // amoy or localhost

  // Switch to Polygon Amoy
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }]
      })
    } catch (switchError) {
      // Network not added yet — add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com']
          }]
        })
      }
    }
  }, [])

  return (
    <BlockchainContext.Provider value={{
      account, provider, signer, contract, chainId,
      connecting, isCorrectNetwork, ROLE_NAMES,
      connectWallet, disconnectWallet, signMessage, switchNetwork
    }}>
      {children}
    </BlockchainContext.Provider>
  )
}

export const useBlockchain = () => {
  const ctx = useContext(BlockchainContext)
  if (!ctx) throw new Error('useBlockchain must be used within BlockchainProvider')
  return ctx
}
