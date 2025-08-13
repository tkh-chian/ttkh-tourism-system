const { sequelize } = require('./backend/config/database');

async function fixOrderModel() {
    console.log('🔧 修复订单模型字段...');
    
    try {
        // 添加缺失的字段
        await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS travel_date DATE,
            ADD COLUMN IF NOT EXISTS adult_count INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS child_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS payment_screenshot TEXT,
            ADD COLUMN IF NOT EXISTS payment_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS return_pdf TEXT,
            ADD COLUMN IF NOT EXISTS return_filename VARCHAR(255)
        `);
        
        console.log('✅ 订单模型字段修复完成');
        
        // 测试订单查询
        console.log('🔍 测试订单查询...');
        const testQuery = await sequelize.query('SELECT * FROM orders LIMIT 1');
        console.log('✅ 订单查询测试成功');
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
    }
}

fixOrderModel();