/**
 * 修复价格日历问题的脚本
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });

// 数据库配置
const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false
};

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
  }
);

async function fixScheduleIssues() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 1. 检查price_schedules表结构
    console.log('检查price_schedules表结构...');
    const [tableInfo] = await sequelize.query(
      'DESCRIBE price_schedules'
    );
    
    console.log('表结构:', tableInfo);
    
    // 2. 查询现有数据
    console.log('查询现有价格日历数据...');
    const [schedules] = await sequelize.query(
      'SELECT * FROM price_schedules LIMIT 10'
    );
    
    console.log('现有数据示例:', schedules);

    // 3. 确保available_stock字段存在
    const hasAvailableStock = tableInfo.some(column => column.Field === 'available_stock');
    if (!hasAvailableStock) {
      console.log('添加available_stock字段...');
      await sequelize.query(
        'ALTER TABLE price_schedules ADD COLUMN available_stock INT DEFAULT 0'
      );
      console.log('available_stock字段添加成功');
    }

    // 4. 更新available_stock值
    console.log('更新available_stock值...');
    await sequelize.query(
      'UPDATE price_schedules SET available_stock = total_stock WHERE available_stock = 0 OR available_stock IS NULL'
    );
    console.log('available_stock值更新成功');

    // 5. 确保travel_date字段格式正确
    console.log('检查travel_date字段格式...');
    const [invalidDates] = await sequelize.query(
      "SELECT id, travel_date FROM price_schedules WHERE travel_date NOT LIKE '____-__-__'"
    );
    
    if (invalidDates.length > 0) {
      console.log('发现格式不正确的日期:', invalidDates);
      console.log('修复日期格式...');
      
      for (const record of invalidDates) {
        const date = new Date(record.travel_date);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toISOString().split('T')[0];
          await sequelize.query(
            'UPDATE price_schedules SET travel_date = ? WHERE id = ?',
            {
              replacements: [formattedDate, record.id]
            }
          );
          console.log(`修复ID=${record.id}的日期: ${record.travel_date} -> ${formattedDate}`);
        } else {
          console.log(`无法修复ID=${record.id}的日期: ${record.travel_date}`);
        }
      }
    } else {
      console.log('所有日期格式正确');
    }

    // 6. 添加测试数据
    console.log('添加测试价格日历数据...');
    
    // 获取所有产品ID
    const [products] = await sequelize.query(
      'SELECT id FROM products LIMIT 10'
    );
    
    if (products.length > 0) {
      const productId = products[0].id;
      console.log(`使用产品ID: ${productId}`);
      
      // 生成未来30天的价格日历
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        
        // 检查是否已存在
        const [existing] = await sequelize.query(
          'SELECT id FROM price_schedules WHERE product_id = ? AND travel_date = ?',
          {
            replacements: [productId, formattedDate]
          }
        );
        
        if (existing.length === 0) {
          // 随机价格和库存
          const price = Math.floor(Math.random() * 500) + 500; // 500-1000
          const stock = Math.floor(Math.random() * 20) + 5; // 5-25
          
          await sequelize.query(
            'INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock, is_available, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, 1, NOW(), NOW())',
            {
              replacements: [productId, formattedDate, price, stock, stock]
            }
          );
          console.log(`添加日期: ${formattedDate}, 价格: ${price}, 库存: ${stock}`);
        } else {
          console.log(`日期 ${formattedDate} 已存在，跳过`);
        }
      }
    } else {
      console.log('没有找到产品，跳过添加测试数据');
    }

    console.log('价格日历问题修复完成');
    await sequelize.close();
    console.log('数据库连接已关闭');

  } catch (error) {
    console.error('修复价格日历问题时出错:', error);
    try {
      await sequelize.close();
    } catch (e) {
      console.error('关闭数据库连接时出错:', e);
    }
  }
}

// 执行修复
fixScheduleIssues();