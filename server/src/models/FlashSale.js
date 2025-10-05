const { pool } = require('../config/database')

function subtract7HoursToMysqlDatetime(input) {
  if (!input) return input
  const date = new Date(input)
  if (isNaN(date.getTime())) return input
  const adjusted = new Date(date.getTime() - 7 * 60 * 60 * 1000)
  return adjusted.toISOString().slice(0, 19).replace('T', ' ')
}

class FlashSale {
  static async create({ name, start_time, end_time, is_active = 1 }) {
    const [result] = await pool.execute(
      `INSERT INTO flash_sales (name, start_time, end_time, is_active) VALUES (?, ?, ?, ?)` ,
      [
        name,
        subtract7HoursToMysqlDatetime(start_time),
        subtract7HoursToMysqlDatetime(end_time),
        is_active
      ]
    )
    return this.findById(result.insertId)
  }

  static async update(id, data) {
    const fields = []
    const params = []
    for (const [key, value] of Object.entries(data)) {
      if (key === 'start_time' || key === 'end_time') {
        fields.push(`${key} = ?`)
        params.push(subtract7HoursToMysqlDatetime(value))
      } else {
        fields.push(`${key} = ?`)
        params.push(value)
      }
    }
    if (fields.length === 0) return this.findById(id)
    params.push(id)
    await pool.execute(`UPDATE flash_sales SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params)
    return this.findById(id)
  }

  static async addProducts(flash_sale_id, items) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const item of items) {
        await conn.execute(
          `INSERT INTO flash_sale_items (flash_sale_id, product_id, sale_price, item_limit)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE sale_price = VALUES(sale_price), item_limit = VALUES(item_limit)` ,
          [flash_sale_id, item.product_id, item.sale_price, item.item_limit ?? null]
        )
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
    return this.findByIdWithItems(flash_sale_id)
  }

  static async removeItem(flash_sale_id, product_id) {
    await pool.execute(
      `DELETE FROM flash_sale_items WHERE flash_sale_id = ? AND product_id = ?`,
      [flash_sale_id, product_id]
    )
    return this.findByIdWithItems(flash_sale_id)
  }

  static async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM flash_sales WHERE id = ?`, [id])
    return rows[0] || null
  }

  static async findByIdWithItems(id) {
    const [saleRows] = await pool.execute(`SELECT * FROM flash_sales WHERE id = ?`, [id])
    if (!saleRows.length) return null
    const sale = saleRows[0]
    const [items] = await pool.execute(
      `SELECT fsi.*, p.name as product_name, p.image as product_image, p.sold as product_sold
       FROM flash_sale_items fsi
       JOIN products p ON p.id = fsi.product_id
       WHERE fsi.flash_sale_id = ?`,
      [id]
    )
    return { ...sale, items }
  }

  static async getActiveNow() {
    // Compare using UTC+7 explicitly to avoid dependence on DB server timezone
    await pool.execute(`SET time_zone = '+07:00'`);
    const [rows] = await pool.execute(
      `SELECT * FROM flash_sales
       WHERE is_active = 1
         AND start_time <= NOW()
         AND end_time > NOW()
       ORDER BY start_time DESC
       LIMIT 1`
    )
    if (!rows.length) return null
    return this.findByIdWithItems(rows[0].id)
  }

  static async findAll(filters = {}) {
    const { page = 1, limit = 10, search = '', status = '' } = filters
    // Coerce pagination inputs to safe integers
    const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? parseInt(page) : 1
    const limitNum = Number.isFinite(Number(limit)) && Number(limit) > 0 ? parseInt(limit) : 10
    const offset = (pageNum - 1) * limitNum
    const where = []
    const params = []
    if (search) {
      where.push('name LIKE ?')
      params.push(`%${search}%`)
    }
    if (status === 'active') {
      // Use UTC+7 window for active state
      where.push('is_active = 1 AND DATE_ADD(start_time, INTERVAL 7 HOUR) <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR) AND DATE_ADD(end_time, INTERVAL 7 HOUR) > DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    } else if (status === 'upcoming') {
      where.push('DATE_ADD(start_time, INTERVAL 7 HOUR) > DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    } else if (status === 'ended') {
      where.push('DATE_ADD(end_time, INTERVAL 7 HOUR) <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    // Some MySQL setups are picky about binding LIMIT/OFFSET in prepared statements.
    // Use safe inlined integers and a regular query.
    const [rows] = await pool.query(
      `SELECT * FROM flash_sales ${whereSql} ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    return rows
  }

  static async getCount(filters = {}) {
    const { search = '', status = '' } = filters
    const where = []
    const params = []
    if (search) {
      where.push('name LIKE ?')
      params.push(`%${search}%`)
    }
    if (status === 'active') {
      where.push('is_active = 1 AND DATE_ADD(start_time, INTERVAL 7 HOUR) <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR) AND DATE_ADD(end_time, INTERVAL 7 HOUR) > DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    } else if (status === 'upcoming') {
      where.push('DATE_ADD(start_time, INTERVAL 7 HOUR) > DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    } else if (status === 'ended') {
      where.push('DATE_ADD(end_time, INTERVAL 7 HOUR) <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)')
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM flash_sales ${whereSql}`, params)
    return rows[0]?.total || 0
  }
}

module.exports = FlashSale


