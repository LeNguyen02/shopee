const { pool } = require('../config/database');

function safeParseImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value];
  }
}
class Product {

  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 30,
      order = 'desc',
      sort_by = 'createdAt',
      category,
      exclude,
      rating_filter,
      price_max,
      price_min,
      name
    } = filters;


    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE conditions
    if (category) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category);
    }

    if (exclude) {
      whereConditions.push('p.id != ?');
      queryParams.push(exclude);
    }

    if (rating_filter) {
      whereConditions.push('p.rating >= ?');
      queryParams.push(rating_filter);
    }

    if (price_min) {
      whereConditions.push('p.price >= ?');
      queryParams.push(price_min);
    }

    if (price_max) {
      whereConditions.push('p.price <= ?');
      queryParams.push(price_max);
    }

    if (name) {
      whereConditions.push('p.name LIKE ?');
      queryParams.push(`%${name}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'p.created_at DESC';
    if (sort_by === 'view') orderBy = `p.view ${order.toUpperCase()}`;
    else if (sort_by === 'sold') orderBy = `p.sold ${order.toUpperCase()}`;
    else if (sort_by === 'price') orderBy = `p.price ${order.toUpperCase()}`;

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    
    const [products] = await pool.query(query, queryParams);

    return products.map(product => ({
      ...product,
      images: safeParseImages(product.images)
    }));
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const product = rows[0];
    product.images = safeParseImages(product.images);
    return product;
  }

  static async incrementView(id) {
    const [result] = await pool.execute(
      'UPDATE products SET view = view + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getCount(filters = {}) {
    const {
      category,
      exclude,
      rating_filter,
      price_max,
      price_min,
      name
    } = filters;

    let whereConditions = [];
    let queryParams = [];

    if (category) {
      whereConditions.push('category_id = ?');
      queryParams.push(category);
    }

    if (exclude) {
      whereConditions.push('id != ?');
      queryParams.push(exclude);
    }

    if (rating_filter) {
      whereConditions.push('rating >= ?');
      queryParams.push(rating_filter);
    }

    if (price_min) {
      whereConditions.push('price >= ?');
      queryParams.push(price_min);
    }

    if (price_max) {
      whereConditions.push('price <= ?');
      queryParams.push(price_max);
    }

    if (name) {
      whereConditions.push('name LIKE ?');
      queryParams.push(`%${name}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [result] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      queryParams
    );

    return result[0].total;
  }
}

module.exports = Product;
