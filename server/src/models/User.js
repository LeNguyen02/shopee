const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, name, phone, address, date_of_birth, roles } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, name, phone, address, date_of_birth, roles) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, phone || null, address || null, date_of_birth || null, roles || 'User']
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, email, name, phone, address, date_of_birth, avatar, roles, verify, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async updateById(id, userData) {
    const fields = [];
    const values = [];
    
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });
    
    if (fields.length === 0) return false;
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    return result.affectedRows > 0;
  }

  // Admin helpers
  static async getAll() {
    const [rows] = await pool.execute(
      `SELECT id, email, name, phone, roles, verify, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  }

  static async update(id, data) {
    return this.updateById(id, data);
  }

  static async updateRole(id, role) {
    const [result] = await pool.execute(
      'UPDATE users SET roles = ? WHERE id = ?',[role, id]
    );
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
