const Log = require('../models/Log');

const recordLog = async ({ type, adminId, username, action, description, metadata, req }) => {
  try {
    let ipAddress = '';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
        // TEMPORARY MOCK IP FOR LOCAL TESTING (Resolves to India)
        ipAddress = '103.241.12.5'; 
      } else if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.replace('::ffff:', '');
      }
    }

    // Resolve Location from IP Address
    let location = 'Localhost / Development';
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== 'localhost') {
      try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (data && !data.error) {
            location = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
          }
        }
      } catch (err) {
        console.error('Failed to resolve IP location:', err.message);
      }
    }

    const logEntry = new Log({
      type,
      admin: adminId,
      adminUsername: username,
      action,
      description,
      metadata: metadata || {},
      ipAddress,
      location
    });

    await logEntry.save();
  } catch (error) {
    console.error('Failed to save log entry:', error);
  }
};

module.exports = { recordLog };
