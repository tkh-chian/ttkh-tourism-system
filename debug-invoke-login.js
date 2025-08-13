(async () => {
  try {
    // 直接调用后端登录控制器以捕获内部日志/异常
    const authController = require('./backend/controllers/authController');
    // 构造 mock req/res
    const req = {
      body: { email: 'admin@ttkh.com', password: 'admin123' },
      headers: {},
      user: null
    };

    let responded = false;
    const res = {
      status(code) {
        this._status = code;
        return this;
      },
      json(obj) {
        responded = true;
        console.log('---CONTROLLER_RESPONSE---');
        console.log('status:', this._status || 200);
        console.log('body:', JSON.stringify(obj, null, 2));
      },
      // fallback
      send(obj) {
        responded = true;
        console.log('---CONTROLLER_SEND---', obj);
      }
    };

    // Call login (it's async)
    await authController.login(req, res);

    if (!responded) {
      console.log('控制器未通过 res 返回（可能抛出异常或直接返回）');
    }
    process.exit(0);
  } catch (err) {
    console.error('---INVOKE_ERROR---');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();