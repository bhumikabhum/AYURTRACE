const express = require("express");
const supabase = require("../config/supabase");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

const NODE_ORDER = ["collector", "aggregator", "processor", "manufacturer"];

/**
 * POST /api/events
 * Log a new supply chain event for a batch
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      batchId, nodeType,
      latitude, longitude, locationName,
      notes, photoUrl, txHash, blockNumber
    } = req.body;

    if (!batchId || !nodeType) {
      return res.status(400).json({ error: "batchId and nodeType are required" });
    }

    const validNodes = ["aggregator", "processor", "manufacturer"];
    if (!validNodes.includes(nodeType)) {
      return res.status(400).json({ error: `nodeType must be one of: ${validNodes.join(", ")}` });
    }

    // Verify user has the correct role for this node
    if (req.user.role !== nodeType && req.user.role !== "admin") {
      return res.status(403).json({
        error: `You are registered as '${req.user.role}' but this node requires '${nodeType}'`
      });
    }

    // Get current batch
    const { data: batch, error: batchErr } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_id", batchId)
      .single();

    if (batchErr || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status === "completed") {
      return res.status(400).json({ error: "Batch is already completed" });
    }

    // Log the event
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .insert({
        batch_id: batchId,
        node_type: nodeType,
        actor_wallet: req.user.walletAddress,
        actor_name: req.user.name,
        latitude: latitude || null,
        longitude: longitude || null,
        location_name: locationName || null,
        notes: notes || null,
        photo_url: photoUrl || null,
        tx_hash: txHash || null,
        block_number: blockNumber || null
      })
      .select()
      .single();

    if (eventErr) throw eventErr;

    // Update batch status
    const newStatus = nodeType === "manufacturer" ? "completed" : nodeType;
    await supabase
      .from("batches")
      .update({
        status: newStatus,
        current_node: nodeType,
        updated_at: new Date().toISOString()
      })
      .eq("batch_id", batchId);

    res.status(201).json({
      message: "Event logged successfully",
      event,
      batchStatus: newStatus
    });
  } catch (err) {
    console.error("Log event error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/batch/:batchId
 * Get all events for a batch
 */
router.get("/batch/:batchId", async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("batch_id", req.params.batchId)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    res.json({ events: events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/recent
 * Get recent events for the dashboard feed
 */
router.get("/recent", authenticate, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*, batches(herb_name)")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ events: events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
