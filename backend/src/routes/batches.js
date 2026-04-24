const express = require("express");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const supabase = require("../config/supabase");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Demo herb data
const HERB_DATA = {
  ashwagandha: { name: "Ashwagandha", latin: "Withania somnifera", sanskrit: "अश्वगंधा" },
  tulsi: { name: "Tulsi", latin: "Ocimum tenuiflorum", sanskrit: "तुलसी" },
  brahmi: { name: "Brahmi", latin: "Bacopa monnieri", sanskrit: "ब्राह्मी" },
  neem: { name: "Neem", latin: "Azadirachta indica", sanskrit: "निम्ब" },
  turmeric: { name: "Turmeric", latin: "Curcuma longa", sanskrit: "हल्दी" },
  ginger: { name: "Ginger", latin: "Zingiber officinale", sanskrit: "अदरक" },
};

/**
 * GET /api/batches
 * List all batches (admin) or filtered by role
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const { role, walletAddress } = req.user;
    let query = supabase.from("batches").select("*").order("created_at", { ascending: false });

    if (role === "collector") {
      // Collectors see batches they created
      const { data: userEvents } = await supabase
        .from("events")
        .select("batch_id")
        .eq("actor_wallet", walletAddress)
        .eq("node_type", "collector");
      const ids = userEvents?.map(e => e.batch_id) || [];
      if (ids.length > 0) query = query.in("batch_id", ids);
      else return res.json({ batches: [] });
    }

    const { data: batches, error } = await query.limit(100);
    if (error) throw error;

    res.json({ batches: batches || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/batches/herbs
 * Get list of supported herbs for the dropdown
 */
router.get("/herbs", (req, res) => {
  res.json({ herbs: Object.values(HERB_DATA) });
});

/**
 * POST /api/batches
 * Create a new herb batch (off-chain record — tx hash added after blockchain confirm)
 */
router.post("/", authenticate, requireRole("collector"), async (req, res) => {
  try {
    const {
      herbName, herbLatin, quantityKg,
      latitude, longitude, locationName,
      notes, photoUrl, txHash
    } = req.body;

    if (!herbName || !quantityKg) {
      return res.status(400).json({ error: "herbName and quantityKg are required" });
    }

    // Generate unique batch ID
    const batchId = `HERB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Generate QR code (points to verify URL)
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${batchId}`;
    const qrCode = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#1a3c2b", light: "#ffffff" }
    });

    // Save batch to Supabase
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .insert({
        batch_id: batchId,
        herb_name: herbName,
        herb_latin: herbLatin || null,
        quantity_kg: quantityKg,
        status: "collected",
        current_node: "collector",
        tx_hash: txHash || null,
        qr_code: qrCode
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Save the first event
    const { error: eventError } = await supabase.from("events").insert({
      batch_id: batchId,
      node_type: "collector",
      actor_wallet: req.user.walletAddress,
      actor_name: req.user.name,
      latitude: latitude || null,
      longitude: longitude || null,
      location_name: locationName || null,
      notes: notes || null,
      photo_url: photoUrl || null,
      tx_hash: txHash || null
    });

    if (eventError) throw eventError;

    res.status(201).json({
      message: "Batch created successfully",
      batch,
      batchId,
      qrCode,
      verifyUrl
    });
  } catch (err) {
    console.error("Create batch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/batches/:batchId
 * Get a single batch with all events
 */
router.get("/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    const { data: batch, error: batchErr } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_id", batchId)
      .single();

    if (batchErr || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("*")
      .eq("batch_id", batchId)
      .order("timestamp", { ascending: true });

    if (eventsErr) throw eventsErr;

    res.json({ batch, events: events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/batches/:batchId/tx
 * Update tx hash after blockchain confirmation
 */
router.patch("/:batchId/tx", authenticate, async (req, res) => {
  try {
    const { txHash } = req.body;
    const { batchId } = req.params;

    await supabase
      .from("batches")
      .update({ tx_hash: txHash, updated_at: new Date().toISOString() })
      .eq("batch_id", batchId);

    res.json({ message: "TX hash updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/batches/:batchId/qr
 * Get QR code for a batch
 */
router.get("/:batchId/qr", async (req, res) => {
  try {
    const { data: batch } = await supabase
      .from("batches")
      .select("qr_code, batch_id")
      .eq("batch_id", req.params.batchId)
      .single();

    if (!batch) return res.status(404).json({ error: "Batch not found" });

    res.json({ qrCode: batch.qr_code, batchId: batch.batch_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
