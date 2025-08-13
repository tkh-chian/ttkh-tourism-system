const axios = require('axios');

(async function main(){
  try {
    const BASE = 'http://localhost:3001';
    const login = await axios.post(BASE + '/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    const token = login.data && login.data.data && login.data.data.token;
    console.log('TOKEN:', token);

    const resp = await axios.get(BASE + '/api/admin/users?status=pending', {
      headers: { Authorization: 'Bearer ' + token }
    });

    console.log('RESPONSE_BODY:');
    console.log(JSON.stringify(resp.data, null, 2));
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