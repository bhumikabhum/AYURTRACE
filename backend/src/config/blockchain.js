
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load ABI from the compiled contract artifacts
// After running `npx hardhat compile`, the ABI will be at this path
let contractABI;
const abiPaths = [
  path.join(__dirname, "../../../blockchain/artifacts/contracts/HerbTrace.sol/HerbTrace.json"),
  path.join(__dirname, "../../HerbTrace.abi.json"),
];

for (const p of abiPaths) {
  if (fs.existsSync(p)) {
    const artifact = JSON.parse(fs.readFileSync(p, "utf8"));
    contractABI = artifact.abi || artifact;
    break;
  }
}

if (!contractABI) {
  console.warn("⚠️  Contract ABI not found. Run `cd blockchain && npx hardhat compile` first.");
  contractABI = [];
}

// Set up provider
const provider = new ethers.JsonRpcProvider(
  process.env.ALCHEMY_RPC_URL || "http://127.0.0.1:8545"
);

// Read-only contract instance (for public reads like verify)
const getReadContract = () => {
  if (!process.env.CONTRACT_ADDRESS) return null;
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
};

// Write contract instance (needs a signer — for backend-initiated writes)
// For this FYP, writes are done from the frontend via MetaMask
// Backend only reads on-chain data

module.exports = { provider, getReadContract, contractABI };
