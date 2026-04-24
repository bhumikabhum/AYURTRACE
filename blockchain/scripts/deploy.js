const { ethers } = require("hardhat");

async function main() {
  console.log("🌿 Deploying HerbTrace contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Deploy the contract
  const HerbTrace = await ethers.getContractFactory("HerbTrace");
  const herbTrace = await HerbTrace.deploy();
  await herbTrace.waitForDeployment();

  const address = await herbTrace.getAddress();

  console.log("✅ HerbTrace deployed to:", address);
  console.log("\n📋 Add these to your .env files:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log("\n🔗 View on Polygonscan (Amoy):");
  console.log(`https://amoy.polygonscan.com/address/${address}`);

  // Save ABI for frontend/backend use
  const fs = require("fs");
  const artifact = require(`./artifacts/contracts/HerbTrace.sol/HerbTrace.json`);

  // Write ABI to shared location
  const abiPath = "./artifacts/HerbTrace.abi.json";
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`\n📄 ABI saved to: ${abiPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exit(1);
  });
