// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HerbTrace
 * @dev Blockchain traceability for Ayurvedic herbs
 * @notice Tracks herbs from wild collector → aggregator → processor → manufacturer
 *
 * AyurTrace — Final Year Project
 */
contract HerbTrace {

    // ─────────────────────────────────────────────
    // ENUMS & STRUCTS
    // ─────────────────────────────────────────────

    enum NodeType { Collector, Aggregator, Processor, Manufacturer }
    enum BatchStatus { Active, Completed, Rejected }

    struct GeoLocation {
        int256 latitude;   // multiplied by 1e6 to store as integer
        int256 longitude;  // multiplied by 1e6 to store as integer
        string locationName;
    }

    struct TraceEvent {
        NodeType nodeType;
        address actor;
        string actorName;
        GeoLocation location;
        string herbName;
        string notes;
        string photoHash;    // IPFS CID of photo
        uint256 timestamp;
        uint256 blockNumber;
    }

    struct Batch {
        string batchId;
        string herbName;
        string herbLatin;
        uint256 quantityGrams;
        BatchStatus status;
        NodeType currentNode;
        address creator;
        uint256 createdAt;
        uint256 eventCount;
    }

    // ─────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────

    address public owner;
    uint256 public totalBatches;
    uint256 public totalEvents;

    // batchId => Batch
    mapping(string => Batch) public batches;

    // batchId => array of TraceEvents
    mapping(string => TraceEvent[]) private batchEvents;

    // wallet => role (0=none, 1=collector, 2=aggregator, 3=processor, 4=manufacturer, 5=admin)
    mapping(address => uint8) public roles;
    mapping(address => string) public actorNames;

    // all batch IDs for enumeration
    string[] public allBatchIds;

    // ─────────────────────────────────────────────
    // EVENTS (blockchain logs)
    // ─────────────────────────────────────────────

    event BatchCreated(string batchId, string herbName, address collector, uint256 timestamp);
    event EventLogged(string batchId, NodeType nodeType, address actor, uint256 timestamp);
    event RoleAssigned(address wallet, uint8 role, string name);
    event BatchCompleted(string batchId, uint256 timestamp);

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

   modifier onlyRole(uint8 requiredRole) {
    require(
        roles[msg.sender] == requiredRole || roles[msg.sender] == 5,
        "Insufficient role"
    );
    _;
}

    modifier batchExists(string memory batchId) {
        require(bytes(batches[batchId].batchId).length > 0, "Batch not found");
        _;
    }

    modifier batchActive(string memory batchId) {
        require(batches[batchId].status == BatchStatus.Active, "Batch not active");
        _;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // Give owner admin role (5)
        roles[msg.sender] = 5;
        actorNames[msg.sender] = "Admin";
    }

    // ─────────────────────────────────────────────
    // ROLE MANAGEMENT
    // ─────────────────────────────────────────────

    /**
     * @dev Assign a role to a wallet address
     * Role codes: 1=Collector, 2=Aggregator, 3=Processor, 4=Manufacturer, 5=Admin
     */
    function assignRole(address wallet, uint8 role, string memory name) external onlyOwner {
        require(role >= 1 && role <= 5, "Invalid role");
        roles[wallet] = role;
        actorNames[wallet] = name;
        emit RoleAssigned(wallet, role, name);
    }

    /**
     * @dev Self-register with a role (open registration for demo/FYP)
     */
    function selfRegister(uint8 role, string memory name) external {
        require(role >= 1 && role <= 4, "Invalid role for self-registration");
        require(roles[msg.sender] == 0, "Already registered");
        roles[msg.sender] = role;
        actorNames[msg.sender] = name;
        emit RoleAssigned(msg.sender, role, name);
    }

    // ─────────────────────────────────────────────
    // BATCH CREATION (Collector only)
    // ─────────────────────────────────────────────

    /**
     * @dev Create a new herb batch — called by a registered collector
     * @param batchId Unique batch identifier (generated off-chain)
     * @param herbName Common name of the herb (e.g., "Ashwagandha")
     * @param herbLatin Latin/scientific name
     * @param quantityGrams Quantity collected in grams
     * @param latE6 Latitude * 1e6 (e.g., 12.971598 → 12971598)
     * @param lngE6 Longitude * 1e6
     * @param locationName Human-readable location name
     * @param notes Collector notes
     * @param photoHash IPFS CID of photo evidence
     */
    function createBatch(
        string memory batchId,
        string memory herbName,
        string memory herbLatin,
        uint256 quantityGrams,
        int256 latE6,
        int256 lngE6,
        string memory locationName,
        string memory notes,
        string memory photoHash
    ) external onlyRole(1) {
        require(bytes(batchId).length > 0, "Batch ID required");
        require(bytes(batches[batchId].batchId).length == 0, "Batch ID already exists");
        require(bytes(herbName).length > 0, "Herb name required");

        // Create the batch
        batches[batchId] = Batch({
            batchId: batchId,
            herbName: herbName,
            herbLatin: herbLatin,
            quantityGrams: quantityGrams,
            status: BatchStatus.Active,
            currentNode: NodeType.Collector,
            creator: msg.sender,
            createdAt: block.timestamp,
            eventCount: 1
        });

        // Log the first trace event
        batchEvents[batchId].push(TraceEvent({
            nodeType: NodeType.Collector,
            actor: msg.sender,
            actorName: actorNames[msg.sender],
            location: GeoLocation(latE6, lngE6, locationName),
            herbName: herbName,
            notes: notes,
            photoHash: photoHash,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));

        allBatchIds.push(batchId);
        totalBatches++;
        totalEvents++;

        emit BatchCreated(batchId, herbName, msg.sender, block.timestamp);
        emit EventLogged(batchId, NodeType.Collector, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // SUPPLY CHAIN EVENTS
    // ─────────────────────────────────────────────

    /**
     * @dev Log an event at any supply chain node
     * @param batchId The batch being updated
     * @param nodeType 0=Collector, 1=Aggregator, 2=Processor, 3=Manufacturer
     * @param latE6 Latitude * 1e6
     * @param lngE6 Longitude * 1e6
     * @param locationName Location name
     * @param notes Notes at this stage
     * @param photoHash IPFS CID
     */
    function logEvent(
        string memory batchId,
        NodeType nodeType,
        int256 latE6,
        int256 lngE6,
        string memory locationName,
        string memory notes,
        string memory photoHash
    ) external batchExists(batchId) batchActive(batchId) {
        // Check caller has appropriate role for this node
        uint8 requiredRole = uint8(nodeType) + 1; // NodeType enum + 1 = role code
        require(roles[msg.sender] >= requiredRole, "Wrong role for this node");

        Batch storage batch = batches[batchId];

        batchEvents[batchId].push(TraceEvent({
            nodeType: nodeType,
            actor: msg.sender,
            actorName: actorNames[msg.sender],
            location: GeoLocation(latE6, lngE6, locationName),
            herbName: batch.herbName,
            notes: notes,
            photoHash: photoHash,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));

        batch.currentNode = nodeType;
        batch.eventCount++;
        totalEvents++;

        // Mark as completed if manufacturer logged
        if (nodeType == NodeType.Manufacturer) {
            batch.status = BatchStatus.Completed;
            emit BatchCompleted(batchId, block.timestamp);
        }

        emit EventLogged(batchId, nodeType, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // QR VERIFICATION (Public read)
    // ─────────────────────────────────────────────

    /**
     * @dev Get batch details — public, no auth needed
     */
    function getBatch(string memory batchId)
        external view batchExists(batchId)
        returns (
            string memory herbName,
            string memory herbLatin,
            uint256 quantityGrams,
            uint8 status,
            uint8 currentNode,
            address creator,
            uint256 createdAt,
            uint256 eventCount
        )
    {
        Batch storage b = batches[batchId];
        return (
            b.herbName,
            b.herbLatin,
            b.quantityGrams,
            uint8(b.status),
            uint8(b.currentNode),
            b.creator,
            b.createdAt,
            b.eventCount
        );
    }

    /**
     * @dev Get number of events for a batch
     */
    function getEventCount(string memory batchId)
        external view batchExists(batchId)
        returns (uint256)
    {
        return batchEvents[batchId].length;
    }

    /**
     * @dev Get a specific event by index
     */
    function getTraceEvent(string memory batchId, uint256 index)
        external view batchExists(batchId)
        returns (
            uint8 nodeType,
            address actor,
            string memory actorName,
            int256 latitude,
            int256 longitude,
            string memory locationName,
            string memory notes,
            string memory photoHash,
            uint256 timestamp,
            uint256 blockNumber
        )
    {
        require(index < batchEvents[batchId].length, "Index out of bounds");
        TraceEvent storage e = batchEvents[batchId][index];
        return (
            uint8(e.nodeType),
            e.actor,
            e.actorName,
            e.location.latitude,
            e.location.longitude,
            e.location.locationName,
            e.notes,
            e.photoHash,
            e.timestamp,
            e.blockNumber
        );
    }

    /**
     * @dev Get all batch IDs (for admin dashboard)
     */
    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    /**
     * @dev Get total stats
     */
    function getStats() external view returns (uint256 _totalBatches, uint256 _totalEvents) {
        return (totalBatches, totalEvents);
    }
}