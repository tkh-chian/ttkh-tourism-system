const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
});

async function testSQL() {
  try {
    const contactInfo = {
      name: 'Test User',
      phone: '123456789',
      email: 'test@test.com'
    };
    
    const sql = `
      INSERT INTO orders (
        order_no, user_id, merchant_id, product_id, travel_date,
        adults, children_no_bed, children_with_bed, infants, total_people,
        unit_price, total_price, total_amount, final_amount, customer_name, 
        customer_phone, customer_email, contact_info, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    console.log('SQL字段数量:', sql.match(/\w+(?=\s*[,)])/g).length);
    console.log('参数占位符数量:', (sql.match(/\?/g) || []).length);
    
    // 测试参数
    const params = [
      'TT123456789', 1, 2, 1, '2025-08-23',
      2, 0, 0, 0, 2,
      99999.00, 199998.00, 199998.00, 199998.00, 'Test Customer',
      '123456789', 'test@test.com', JSON.stringify(contactInfo), 'Test notes'
    ];
    
    console.log('实际参数数量:', params.length);
    
    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

testSQL();