const db = require('./database');
const query = `
    SELECT 
      u.id, 
      u.username, 
      u.bank_name, 
      u.account_type, 
      u.account_number, 
      u.payout_email,
      u.bank_account as legacy_bank_account,
      COALESCE(SUM(CASE WHEN r.paid_at IS NULL THEN r.uploader_earned ELSE 0 END), 0) as pendingEarnings,
      COALESCE(SUM(r.uploader_earned), 0) as totalEarnings
    FROM users u
    LEFT JOIN videos v ON u.id = v.uploader_id
    LEFT JOIN rentals r ON v.id = r.video_id
    WHERE u.role = 'creator'
    GROUP BY u.id
    ORDER BY pendingEarnings DESC, totalEarnings DESC
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
