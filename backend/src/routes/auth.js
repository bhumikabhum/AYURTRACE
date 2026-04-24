const express = require("express");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const supabase = require("../config/supabase");

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with their wallet address and role
 */
router.post("/register", async (req, res) => {
  try {
    const { walletAddress, role, name, location } = req.body;

    if (!walletAddress || !role || !name) {
      return res.status(400).json({ error: "walletAddress, role, and name are required" });
    }

    const validRoles = ["collector", "aggregator", "processor", "manufacturer", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}` });
    }

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if already registered
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Wallet already registered", user: existing });
    }

    // Insert new user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        wallet_address: normalizedAddress,
        role,
        name,
        location: location || null
      })
      .select()
      .single();

    if (error) throw error;

    // Issue JWT
    const token = jwt.sign(
      { walletAddress: normalizedAddress, role, name, userId: user.id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Registered successfully", user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Login with wallet address (MetaMask signature verification)
 */
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "walletAddress, signature, and message required" });
    }

    // Verify the signature (proves ownership of wallet)
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Find user in database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "Wallet not registered. Please register first." });
    }

    // Issue JWT
    const token = jwt.sign(
      { walletAddress: user.wallet_address, role: user.role, name: user.name, userId: user.id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from wallet
 */
router.get("/me/:walletAddress", async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", req.params.walletAddress.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
