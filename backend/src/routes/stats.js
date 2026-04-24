const express = require("express");
const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/stats
 * Overall platform statistics for admin dashboard
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // Total batches
    const { count: totalBatches } = await supabase
      .from("batches")
      .select("*", { count: "exact", head: true });

    // Completed batches
    const { count: completedBatches } = await supabase
      .from("batches")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Total events
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Herbs distribution
    const { data: herbsData } = await supabase
      .from("batches")
      .select("herb_name");

    const herbCounts = {};
    (herbsData || []).forEach(b => {
      herbCounts[b.herb_name] = (herbCounts[b.herb_name] || 0) + 1;
    });
    const herbsDistribution = Object.entries(herbCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Node activity
    const { data: nodeData } = await supabase
      .from("events")
      .select("node_type");

    const nodeCounts = { collector: 0, aggregator: 0, processor: 0, manufacturer: 0 };
    (nodeData || []).forEach(e => {
      if (nodeCounts[e.node_type] !== undefined) nodeCounts[e.node_type]++;
    });

    // Recent batches
    const { data: recentBatches } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    res.json({
      overview: {
        totalBatches: totalBatches || 0,
        completedBatches: completedBatches || 0,
        totalEvents: totalEvents || 0,
        totalUsers: totalUsers || 0,
        completionRate: totalBatches
          ? Math.round((completedBatches / totalBatches) * 100)
          : 0
      },
      herbsDistribution,
      nodeActivity: nodeCounts,
      recentBatches: recentBatches || []
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
