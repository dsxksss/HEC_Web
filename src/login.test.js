// 登录检测功能测试

// 模拟document.cookie对象
const mockDocumentCookie = (cookies) => {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: cookies
  });
};

// 测试开始前重置模块缓存
delete require.cache[require.resolve('./login.js')];

// 导入登录模块
try {
  const { getCookie, checkWemolLogin, getCurrentUserInfo } = require('./login.js');
  
  console.log('=== 开始wemol平台登录检测功能测试 ===');
  
  // 测试1：获取cookie功能
  console.log('\n测试1：获取cookie功能');
  mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123; other_cookie=value');
  console.log('获取ant_uid:', getCookie('ant_uid')); // 应该输出: testuser
  console.log('获取ant_uid_sys:', getCookie('ant_uid_sys')); // 应该输出: system123
  console.log('获取不存在的cookie:', getCookie('not_exist')); // 应该输出: null
  
  // 测试2：检查登录状态 - 已登录情况
  console.log('\n测试2：检查登录状态 - 已登录情况');
  mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
  console.log('登录状态:', checkWemolLogin()); // 应该输出: true
  
  // 测试3：检查登录状态 - 未登录情况（缺少ant_uid）
  console.log('\n测试3：检查登录状态 - 未登录情况（缺少ant_uid）');
  mockDocumentCookie('ant_uid_sys=system123');
  console.log('登录状态:', checkWemolLogin()); // 应该输出: false
  
  // 测试4：检查登录状态 - 未登录情况（缺少ant_uid_sys）
  console.log('\n测试4：检查登录状态 - 未登录情况（缺少ant_uid_sys）');
  mockDocumentCookie('ant_uid=testuser');
  console.log('登录状态:', checkWemolLogin()); // 应该输出: false
  
  // 测试5：获取用户信息 - 已登录情况
  console.log('\n测试5：获取用户信息 - 已登录情况');
  mockDocumentCookie('ant_uid=testuser; ant_uid_sys=system123');
  console.log('用户信息:', getCurrentUserInfo()); // 应该输出包含ant_uid和ant_uid_sys的对象
  
  // 测试6：获取用户信息 - 未登录情况
  console.log('\n测试6：获取用户信息 - 未登录情况');
  mockDocumentCookie('');
  console.log('用户信息:', getCurrentUserInfo()); // 应该输出: null
  
  console.log('\n=== wemol平台登录检测功能测试完成 ===');
} catch (error) {
  console.error('测试出错:', error);
  console.log('\n=== wemol平台登录检测功能测试失败 ===');
}

// 注意：这个测试文件需要在Node.js环境下运行，或者在浏览器控制台中适当修改后使用。
// 在实际应用中，autoLoginCheck和handleNotLoggedIn等函数会在浏览器环境中正常工作。