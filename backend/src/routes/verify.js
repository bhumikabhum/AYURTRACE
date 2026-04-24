const express = require("express");
const supabase = require("../config/supabase");
const { getReadContract } = require("../config/blockchain");

const router = express.Router();

/**
 * GET /api/verify/:batchId
 * Public endpoint — called when consumer scans QR code
 * Returns full traceability trail (no auth needed)
 */
router.get("/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch from database
    const { data: batch, error: batchErr } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_id", batchId)
      .single();

    if (batchErr || !batch) {
      return res.status(404).json({
        verified: false,
        error: "Batch not found. This QR code may be invalid."
      });
    }

    // Get all supply chain events
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("*")
      .eq("batch_id", batchId)
      .order("timestamp", { ascending: true });

    if (eventsErr) throw eventsErr;

    // Try to get on-chain data for verification (optional - fails gracefully)
    let onChainData = null;
    try {
      const contract = getReadContract();
      if (contract && batch.tx_hash) {
        const [herbName, , , status, currentNode, , createdAt, eventCount] =
          await contract.getBatch(batchId);
        onChainData = {
          herbName,
          status: Number(status),
          currentNode: Number(currentNode),
          createdAt: Number(createdAt),
          eventCount: Number(eventCount)
        };
      }
    } catch (chainErr) {
      // Blockchain read failed - still return database data
      console.log("Chain read skipped:", chainErr.message);
    }

    // Build verification response
    const nodeLabels = ["Collector", "Aggregator", "Processor", "Manufacturer"];
    const statusLabels = ["collected", "aggregated", "processed", "completed"];

    const trail = events.map((e, idx) => ({
      step: idx + 1,
      nodeType: e.node_type,
      nodeLabel: nodeLabels[["collector","aggregator","processor","manufacturer"].indexOf(e.node_type)] || e.node_type,
      actorName: e.actor_name,
      actorWallet: e.actor_wallet,
      location: {
        latitude: e.latitude,
        longitude: e.longitude,
        name: e.location_name
      },
      notes: e.notes,
      photoUrl: e.photo_url,
      txHash: e.tx_hash,
      blockNumber: e.block_number,
      timestamp: e.timestamp
    }));

    res.json({
      verified: true,
      batchId: batch.batch_id,
      herbName: batch.herb_name,
      herbLatin: batch.herb_latin,
      quantityKg: batch.quantity_kg,
      status: batch.status,
      currentNode: batch.current_node,
      createdAt: batch.created_at,
      updatedAt: batch.updated_at,
      trail,
      onChainVerified: !!onChainData,
      onChainData,
      // Consumer-friendly summary
      summary: {
        totalNodes: trail.length,
        originLocation: trail[0]?.location?.name || "Unknown",
        originDate: trail[0]?.timestamp,
        isComplete: batch.status === "completed",
        isBlockchainVerified: !!onChainData
      }
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
