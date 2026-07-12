const Log = require('../models/Log');

/**
 * Prunes system logs that are older than 90 days from the database.
 */
const pruneOldLogs = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const result = await Log.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
    if (result.deletedCount > 0) {
      console.log(`[Maintenance] Auto-pruned ${result.deletedCount} system logs older than 90 days from the database.`);
    } else {
      console.log('[Maintenance] Logs auto-prune complete. No logs older than 90 days found.');
    }
  } catch (error) {
    console.error('[Maintenance Error] Auto-pruning failed:', error.message);
  }
};

/**
 * Initializes the background logs maintenance worker on server startup.
 * Runs immediately once, then schedules to repeat once every 24 hours.
 */
const initLogsMaintenance = () => {
  // Run once immediately on server startup
  pruneOldLogs();

  // Run once every 24 hours
  const intervalMs = 24 * 60 * 60 * 1000;
  setInterval(pruneOldLogs, intervalMs);
};

module.exports = { initLogsMaintenance, pruneOldLogs };
