require('dotenv').config();
const { pool } = require('../config/database');

async function columnExists(tableName, columnName) {
	const [rows] = await pool.query(
		`SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
		[process.env.DB_NAME, tableName, columnName]
	);
	return rows[0]?.cnt > 0;
}

async function migrateMomo() {
	try {
		console.log('🔄 Migrating MoMo payment support...');

		// 1) Extend payment_method enum to include 'momo' (ignore if already present)
		try {
			await pool.query(`
				ALTER TABLE orders 
				MODIFY COLUMN payment_method ENUM('cod', 'stripe', 'momo') NOT NULL
			`);
			console.log('✅ Updated payment_method enum with momo');
		} catch (e) {
			console.warn('ℹ️ Skip enum modify (maybe already updated):', e.code || e.message);
		}

		// 2) Add MoMo-related columns individually if missing
		const toAdd = [
			{
				name: 'momo_transfer_note',
				ddl: "ALTER TABLE orders ADD COLUMN momo_transfer_note VARCHAR(255) NULL AFTER message"
			},
			{
				name: 'user_payment_confirmed',
				ddl: "ALTER TABLE orders ADD COLUMN user_payment_confirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_status"
			},
			{
				name: 'user_payment_confirmed_at',
				ddl: "ALTER TABLE orders ADD COLUMN user_payment_confirmed_at DATETIME NULL AFTER user_payment_confirmed"
			}
		];

		for (const col of toAdd) {
			const exists = await columnExists('orders', col.name);
			if (!exists) {
				await pool.query(col.ddl);
				console.log(`✅ Added column ${col.name}`);
			} else {
				console.log(`ℹ️ Column ${col.name} already exists`);
			}
		}

		// 3) Create shop_settings table for storing settings
		await pool.query(`
			CREATE TABLE IF NOT EXISTS shop_settings (
				id INT AUTO_INCREMENT PRIMARY KEY,
				setting_key VARCHAR(100) NOT NULL UNIQUE,
				setting_value JSON NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
		`);

		// 4) Seed default momo settings if missing
		await pool.query(`
			INSERT IGNORE INTO shop_settings (setting_key, setting_value) VALUES (
				'momo', JSON_OBJECT(
					'name', '',
					'account_number', '',
					'qr_image_url', '',
					'instructions', ''
				)
			)
		`);

		console.log('✅ MoMo migration completed');
	} catch (error) {
		console.error('❌ MoMo migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	migrateMomo()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = migrateMomo; 