// 完整的登录功能测试

// 模拟document.cookie对象
const mockDocumentCookie = (cookies) => {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: cookies
  });
};

// 模拟fetch API
const mockFetch = (response) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response)
    })
  );
};

// 重置模块缓存
delete require.cache[require.resolve('./login.js')];

// 导入登录模块
let loginModule;

// 测试开始前的设置
beforeEach(() => {
  // 重置mock
  jest.clearAllMocks();
  
  // 模拟document和window对象
  global.document = {
    cookie: ''
  };
  global.window = {};
  
  // 导入模块
  loginModule = require('./login.js');
});

describe('登录功能测试套件', () => {
  // 测试getCookie函数
  describe('getCookie函数测试', () => {
    test('应该正确获取存在的cookie值', () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123; other_cookie=value');
      expect(loginModule.getCookie('ant_uid')).toBe('testuser');
      expect(loginModule.getCookie('ant_uid_sys')).toBe('system123');
    });

    test('应该为不存在的cookie返回null', () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      expect(loginModule.getCookie('not_exist')).toBeNull();
    });

    test('应该在空cookie字符串时返回null', () => {
      mockDocumentCookie('');
      expect(loginModule.getCookie('ant_uid')).toBeNull();
    });
  });

  // 测试checkWemolLogin函数
  describe('checkWemolLogin函数测试', () => {
    test('应该在cookie存在时返回true', () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      expect(loginModule.checkWemolLogin()).toBe(true);
    });

    test('应该在缺少ant_uid时返回false', () => {
      mockDocumentCookie('ant_uid_sys=system123');
      expect(loginModule.checkWemolLogin()).toBe(false);
    });

    test('应该在缺少ant_uid_sys时返回false', () => {
      mockDocumentCookie('ant_uid=testuser');
      expect(loginModule.checkWemolLogin()).toBe(false);
    });

    test('应该在cookie为空时返回false', () => {
      mockDocumentCookie('');
      expect(loginModule.checkWemolLogin()).toBe(false);
    });
  });

  // 测试getCurrentUserInfo函数
  describe('getCurrentUserInfo函数测试', () => {
    test('应该在登录时返回用户信息对象', () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      const userInfo = loginModule.getCurrentUserInfo();
      expect(userInfo).toEqual({
        ant_uid: 'testuser',
        ant_uid_sys: 'system123'
      });
    });

    test('应该在未登录时返回null', () => {
      mockDocumentCookie('');
      expect(loginModule.getCurrentUserInfo()).toBeNull();
    });
  });

  // 测试autoLoginCheck函数
  describe('autoLoginCheck函数测试', () => {
    test('应该在cookie存在时返回true', async () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      const result = await loginModule.autoLoginCheck();
      expect(result).toBe(true);
    });

    test('应该在cookie不存在但API验证成功时返回true', async () => {
      mockDocumentCookie('');
      mockFetch({
        success: true
      });
      const result = await loginModule.autoLoginCheck();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/login_status', expect.any(Object));
    });

    test('应该在cookie不存在且API验证失败时返回false', async () => {
      mockDocumentCookie('');
      mockFetch({
        success: false
      });
      const result = await loginModule.autoLoginCheck();
      expect(result).toBe(false);
    });

    test('应该在fetch出错时返回false', async () => {
      mockDocumentCookie('');
      global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network Error')));
      const result = await loginModule.autoLoginCheck();
      expect(result).toBe(false);
    });
  });

  // 测试login函数
  describe('login函数测试', () => {
    test('应该在用户登录成功时返回true', async () => {
      mockFetch({
        success: true
      });
      const result = await loginModule.login('testuser', 'password123', 'user');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/login', expect.any(Object));
    });

    test('应该在系统登录成功时返回true', async () => {
      mockFetch({
        success: true
      });
      const result = await loginModule.login('admin', 'admin123', 'sys');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/sys/login', expect.any(Object));
    });

    test('应该在登录失败时抛出错误', async () => {
      mockFetch({
        success: false,
        message: '用户名或密码错误'
      });
      await expect(loginModule.login('wronguser', 'wrongpass', 'user')).rejects.toThrow('用户名或密码错误');
    });

    test('应该在fetch出错时抛出错误', async () => {
      global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network Error')));
      await expect(loginModule.login('testuser', 'password123', 'user')).rejects.toThrow('Network Error');
    });

    test('应该在response.ok为false时抛出错误', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('Unauthorized access')
        })
      );
      await expect(loginModule.login('testuser', 'password123', 'user')).rejects.toThrow('登录请求失败: 401 Unauthorized');
    });
  });

  // 测试logout函数
  describe('logout函数测试', () => {
    test('应该在退出登录成功时返回true', async () => {
      mockFetch({});
      const result = await loginModule.logout();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/logout', expect.any(Object));
    });

    test('应该在fetch出错时返回false', async () => {
      global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network Error')));
      const result = await loginModule.logout();
      expect(result).toBe(false);
    });

    test('应该在response.ok为false时返回false', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false
        })
      );
      const result = await loginModule.logout();
      expect(result).toBe(false);
    });
  });

  // 测试handleNotLoggedIn函数
  describe('handleNotLoggedIn函数测试', () => {
    test('应该抛出未登录错误', () => {
      expect(() => loginModule.handleNotLoggedIn()).toThrow('用户未登录，请先登录wemol平台');
    });
  });

  // 测试getUserSession函数
  describe('getUserSession函数测试', () => {
    test('应该在未登录时返回null', async () => {
      mockDocumentCookie('');
      const result = await loginModule.getUserSession();
      expect(result).toBeNull();
    });

    test('应该在登录时返回会话信息', async () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      const mockSession = { userId: '123', username: 'testuser' };
      mockFetch({ Data: mockSession });
      const result = await loginModule.getUserSession();
      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/session', expect.any(Object));
    });

    test('应该在fetch出错时返回null', async () => {
      mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
      global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network Error')));
      const result = await loginModule.getUserSession();
      expect(result).toBeNull();
    });
  });
});

console.log('=== 登录功能测试套件执行完毕 ===');