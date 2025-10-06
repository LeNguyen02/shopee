const { pool } = require('../config/database')

class Banner {
  static async findAll({ position = 'main', onlyActive = true } = {}) {
    const conditions = []
    const params = []
    if (position) {
      conditions.push('position = ?')
      params.push(position)
    }
    if (onlyActive) {
      conditions.push('is_active = 1')
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [rows] = await pool.query(
      `SELECT * FROM banners ${where} ORDER BY sort_order ASC, id DESC`
      , params
    )
    return rows
  }

  static async create({ image, link = null, position = 'main', sort_order = 0, is_active = 1 }) {
    const [result] = await pool.query(
      'INSERT INTO banners (image, link, position, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [image, link, position, sort_order, is_active]
    )
    return { id: result.insertId, image, link, position, sort_order, is_active }
  }

  static async delete(id) {
    await pool.query('DELETE FROM banners WHERE id = ?', [id])
    return true
  }
}

module.exports = Banner


