require('dotenv').config()
const { pool } = require('./src/config/database')

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max 256GB',
    description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Super Retina XDR 6.7 inch',
    category_id: 2, // Điện thoại và phụ kiện
    image: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
    images: JSON.stringify([
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-2-600x600.jpg'
    ]),
    price: 29990000,
    price_before_discount: 34990000,
    quantity: 50,
    sold: 25,
    view: 1250,
    rating: 4.8
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB',
    description: 'Samsung Galaxy S24 Ultra với S Pen, camera 200MP, màn hình Dynamic AMOLED 6.8 inch',
    category_id: 2,
    image: 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
    images: JSON.stringify([
      'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg'
    ]),
    price: 27990000,
    price_before_discount: 31990000,
    quantity: 30,
    sold: 18,
    view: 890,
    rating: 4.7
  },
  {
    name: 'MacBook Air M3 13 inch 256GB',
    description: 'MacBook Air với chip M3, màn hình Liquid Retina 13.6 inch, pin 18 giờ',
    category_id: 4, // Máy tính & laptop
    image: 'https://cdn.tgdd.vn/Products/Images/44/322096/macbook-air-13-inch-m3-2024-starlight-thumbnew-600x600.jpg',
    images: JSON.stringify([
      'https://cdn.tgdd.vn/Products/Images/44/322096/macbook-air-13-inch-m3-2024-starlight-thumbnew-600x600.jpg'
    ]),
    price: 28990000,
    price_before_discount: 32990000,
    quantity: 20,
    sold: 12,
    view: 650,
    rating: 4.9
  },
  {
    name: 'Áo thun nam cotton 100%',
    description: 'Áo thun nam chất liệu cotton 100%, thoáng mát, form regular fit',
    category_id: 1, // Thời trang nam
    image: 'https://cf.shopee.vn/file/d4bbea4570b93bfd5fc652ece98b9ea7',
    images: JSON.stringify([
      'https://cf.shopee.vn/file/d4bbea4570b93bfd5fc652ece98b9ea7'
    ]),
    price: 199000,
    price_before_discount: 299000,
    quantity: 100,
    sold: 45,
    view: 320,
    rating: 4.5
  },
  {
    name: 'Giày sneaker nam thể thao',
    description: 'Giày sneaker nam phong cách thể thao, đế cao su êm ái, phù hợp mọi hoạt động',
    category_id: 7, // Giày dép nam
    image: 'https://cf.shopee.vn/file/7abfbfee3c4844652b4a8245e473d857',
    images: JSON.stringify([
      'https://cf.shopee.vn/file/7abfbfee3c4844652b4a8245e473d857'
    ]),
    price: 599000,
    price_before_discount: 799000,
    quantity: 75,
    sold: 32,
    view: 480,
    rating: 4.3
  },
  {
    name: 'Đầm maxi nữ họa tiết hoa',
    description: 'Đầm maxi nữ chất liệu voan mềm mại, họa tiết hoa xinh xắn, phù hợp dạo phố',
    category_id: 11, // Thời trang nữ
    image: 'https://cf.shopee.vn/file/sg-11134201-22120-u6m3c2q5jglv89',
    images: JSON.stringify([
      'https://cf.shopee.vn/file/sg-11134201-22120-u6m3c2q5jglv89'
    ]),
    price: 350000,
    price_before_discount: 450000,
    quantity: 60,
    sold: 28,
    view: 290,
    rating: 4.6
  },
  {
    name: 'Tai nghe Bluetooth AirPods Pro 2',
    description: 'Tai nghe không dây AirPods Pro thế hệ 2, chống ồn chủ động, âm thanh Hi-Fi',
    category_id: 2, // Điện thoại và phụ kiện
    image: 'https://cdn.tgdd.vn/Products/Images/54/289780/airpods-pro-2nd-gen-usb-c-apple-thumbnew-600x600.jpg',
    images: JSON.stringify([
      'https://cdn.tgdd.vn/Products/Images/54/289780/airpods-pro-2nd-gen-usb-c-apple-thumbnew-600x600.jpg'
    ]),
    price: 5990000,
    price_before_discount: 6990000,
    quantity: 40,
    sold: 22,
    view: 780,
    rating: 4.8
  },
  {
    name: 'Nồi cơm điện tử Panasonic 1.8L',
    description: 'Nồi cơm điện tử Panasonic 1.8L, công nghệ IH, lòng nồi chống dính cao cấp',
    category_id: 8, // Thiết bị điện gia dụng
    image: 'https://cdn.tgdd.vn/Products/Images/1922/78878/noi-com-dien-panasonic-sr-ms183wra-1-8-lit-1-600x600.jpg',
    images: JSON.stringify([
      'https://cdn.tgdd.vn/Products/Images/1922/78878/noi-com-dien-panasonic-sr-ms183wra-1-8-lit-1-600x600.jpg'
    ]),
    price: 2490000,
    price_before_discount: 2990000,
    quantity: 25,
    sold: 15,
    view: 180,
    rating: 4.4
  }
]

async function seedProducts() {
  try {
    console.log('🌱 Seeding sample products...')
    
    for (const product of sampleProducts) {
      await pool.execute(`
        INSERT INTO products (name, description, category_id, image, images, price, price_before_discount, quantity, sold, view, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name,
        product.description,
        product.category_id,
        product.image,
        product.images,
        product.price,
        product.price_before_discount,
        product.quantity,
        product.sold,
        product.view,
        product.rating
      ])
      console.log(`✅ Added product: ${product.name}`)
    }
    
    console.log('🎉 Sample products seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding products:', error.message)
    process.exit(1)
  }
}

seedProducts()
