const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

(async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ttkh_tourism'
  };

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功，检查并添加缺失字段...');

    // 1) users.agent_id
    const [userCol] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'agent_id'`,
      [dbConfig.database]
    );
    if (userCol[0].cnt === 0) {
      console.log('users.agent_id 不存在，添加列 agent_id ...');
      await conn.query(`ALTER TABLE users ADD COLUMN agent_id CHAR(36) NULL AFTER email`);
      console.log('已添加 users.agent_id');
    } else {
      console.log('users.agent_id 已存在');
    }

    // 2) products.product_number
    const [prodCol] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'product_number'`,
      [dbConfig.database]
    );
    if (prodCol[0].cnt === 0) {
      console.log('products.product_number 不存在，添加列 product_number ...');
      await conn.query(`ALTER TABLE products ADD COLUMN product_number VARCHAR(64) NULL`);
      // 添加唯一索引（如果已有重复将失败；先尝试清理 NULLs）
      try {
        await conn.query(`CREATE UNIQUE INDEX ux_products_product_number ON products (product_number)`);
        console.log('已添加 products.product_number 及唯一索引');
      } catch (e) {
        console.log('添加唯一索引时发生问题（可能存在重复或 NULL），已保留列但未创建唯一索引:', e.message);
      }
    } else {
      console.log('products.product_number 已存在');
      // 确保存在唯一索引
      const [idxRows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND INDEX_NAME = 'ux_products_product_number'`,
        [dbConfig.database]
      );
      if (idxRows[0].cnt === 0) {
        try {
          await conn.query(`CREATE UNIQUE INDEX ux_products_product_number ON products (product_number)`);
          console.log('已为 products.product_number 创建唯一索引');
        } catch (e) {
          console.log('创建唯一索引失败（可能存在重复），跳过索引创建:', e.message);
        }
      } else {
        console.log('products.product_number 已有唯一索引');
      }
    }

    // 3) 为现有产品生成 product_number（仅对 product_number IS NULL 或空的行）
    console.log('为缺失的产品编号生成 product_number ...');
    // 使用 UUID 生成并去除 "-"，并以 P 开头
    const [missingRows] = await conn.execute(`SELECT id FROM products WHERE product_number IS NULL OR product_number = '' LIMIT 100`);
    if (missingRows.length > 0) {
      for (const r of missingRows) {
        const [res] = await conn.execute(`SELECT REPLACE(UUID(),'-','') AS uu`);
        const pn = 'P' + res[0].uu;
        try {
          await conn.execute(`UPDATE products SET product_number = ? WHERE id = ?`, [pn, r.id]);
        } catch (e) {
          console.log('更新 product_number 失败，跳过 id=', r.id, e.message);
        }
      }
      console.log('缺失的 product_number 已生成（最多首批 100）');
    } else {
      console.log('没有需要生成 product_number 的产品');
    }

    console.log('字段检查与修复完成');
  } catch (err) {
    console.error('操作失败:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (conn) {
      try { await conn.end(); } catch (_) {}
    }
  }
})();