const bcrypt = require('bcryptjs');

// In-memory storage for testing (replace with database later)
let users = [];
let nextId = 1;

class UserMemory {
  static async create(userData) {
    const { email, password, name, phone, address, date_of_birth } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = {
      id: nextId++,
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      address: address || null,
      date_of_birth: date_of_birth || null,
      avatar: null,
      roles: 'User',
      verify: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    users.push(user);
    return user.id;
  }

  static async findByEmail(email) {
    return users.find(user => user.email === email) || null;
  }

  static async findById(id) {
    const user = users.find(user => user.id === id);
    if (!user) return null;
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async createDefaultAdmin() {
    const adminExists = users.find(u => u.email === 'admin@shopee.com');
    if (!adminExists) {
      await this.create({
        email: 'admin@shopee.com',
        password: 'admin123',
        name: 'Admin User',
        roles: 'Admin'
      });
    }
  }

  static async getAll() {
    return users;
  }

  static async updateById(id, userData) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    users[userIndex] = { ...users[userIndex], ...userData, updated_at: new Date() };
    return true;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    users[userIndex].password = hashedPassword;
    users[userIndex].updated_at = new Date();
    return true;
  }

  static async updateRole(id, role) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    users[userIndex].roles = role;
    users[userIndex].updated_at = new Date();
    return true;
  }
}

module.exports = UserMemory;
