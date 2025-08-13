const axios = require('axios');

(async function main(){
  try {
    const BASE = 'http://localhost:3001';
    // 1) 注册一个商家账号
    const merchant = {
      username: 'dbg_merchant_' + Date.now(),
      email: 'dbg_merchant_' + Date.now() + '@test.com',
      password: '123456',
      role: 'merchant',
      company_name: 'DBG Travel',
      contact_person: 'DBG Contact'
    };
    console.log('Registering merchant:', merchant.email);
    try {
      const reg = await axios.post(BASE + '/api/auth/register', merchant);
      console.log('REGISTER_RESPONSE:', JSON.stringify(reg.data || {}, null, 2));
    } catch (e) {
      console.log('REGISTER_ERROR:', e.message);
      if (e.response) {
        console.log('REGISTER_ERROR_DETAILS:', JSON.stringify(e.response.data || {}, null, 2));
      }
    }

    // 2) 登录管理员
    const login = await axios.post(BASE + '/api/auth/login', { email: 'admin@ttkh.com', password: 'admin123' });
    const token = login.data && login.data.data && login.data.data.token;
    console.log('ADMIN_TOKEN:', token);

    // 3) 获取 pending 列表
    const resp = await axios.get(BASE + '/api/admin/users?status=pending', {
      headers: { Authorization: 'Bearer ' + token }
    }).catch(e => e.response && e.response.data ? e.response.data : { error: e.message });
    console.log('PENDING_USERS_RESPONSE:', JSON.stringify(resp.data || resp, null, 2));

    // 4) 查询刚创建的用户详情（通过邮箱）
    const usersList = (resp.data && resp.data.users) || (resp.data && Array.isArray(resp.data) ? resp.data : null);
    console.log('PENDING_USERS_COUNT:', usersList ? usersList.length : 'N/A');

    // Also direct fetch product by searching all users via admin list without status
    const respAll = await axios.get(BASE + '/api/admin/users', { headers: { Authorization: 'Bearer ' + token }});
    console.log('ALL_USERS_FIRST_PAGE_COUNT:', respAll.data && respAll.data.length ? respAll.data.length : (respAll.data && respAll.data.length === undefined ? JSON.stringify(respAll.data,null,2) : 'N/A'));

  } catch (err) {
    if (err.response && err.response.data) {
      console.error('ERR_RESPONSE:');
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('ERR:', err.message);
    }
    process.exit(1);
  }
})();