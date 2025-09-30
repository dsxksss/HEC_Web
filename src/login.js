// wemol平台登录检测功能

/**
 * 从cookie中获取指定名称的值
 * @param {string} name - cookie名称
 * @returns {string|null} - cookie值，如果不存在则返回null
 */
export function getCookie(name) {
  const cookieString = document.cookie;
  const cookies = cookieString.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // 检查cookie是否以指定名称开头
    if (cookie.startsWith(`${name}=`)) {
      // 提取并解码cookie值
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * 检查用户是否已登录wemol平台
 * @returns {boolean} - 用户是否已登录
 */
export function checkWemolLogin() {
  const antUid = getCookie('ant_uid');
  const antUidSys = getCookie('ant_uid_sys');
  
  // 如果ant_uid和ant_uid_sys都存在，则认为用户已登录
  return antUid !== null && antUidSys !== null;
}

/**
 * 获取当前登录用户的信息
 * @returns {Object|null} - 用户信息对象，如果未登录则返回null
 */
export function getCurrentUserInfo() {
  const antUid = getCookie('ant_uid');
  const antUidSys = getCookie('ant_uid_sys');
  
  if (antUid && antUidSys) {
    return {
      ant_uid: antUid,
      ant_uid_sys: antUidSys,
      // 可以根据需要添加更多信息
    };
  }
  
  return null;
}

/**
 * 执行自动登录检测
 * 检查用户是否已登录，如果未登录则执行相应操作
 * @returns {Promise<boolean>} - 登录检测结果
 */
export async function autoLoginCheck() {
  try {
    // 首先检查本地cookie
    const isLoggedIn = checkWemolLogin();
    
    if (isLoggedIn) {
      // 用户已登录，返回用户信息
      const userInfo = getCurrentUserInfo();
      console.log('用户已登录wemol平台:', userInfo);
      return true;
    } else {
      // 用户未登录，尝试通过接口验证
      // 注意：这里使用相对路径，确保能正确与base URL配合工作
      const response = await fetch('/api/user/login_status', {
        method: 'POST',
        credentials: 'include', // 确保发送cookie
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          // 假设接口返回的格式包含登录状态
          if (data.success || (data.Data && data.Data.User && data.Data.User.status === 'enabled')) {
            console.log('通过接口验证用户已登录');
            return true;
          }
        } catch (jsonError) {
          console.error('登录状态接口返回非JSON数据:', jsonError);
          // 处理非JSON响应的情况，默认为未登录
        }
      }
      
      console.log('用户未登录wemol平台');
      return false;
    }
  } catch (error) {
    console.error('登录检测失败:', error);
    // 出错时默认认为未登录
    return false;
  }
}

/**
 * 处理未登录状态
 * 显示登录提示，而不是直接重定向
 * 因为项目没有独立的登录页面，而是依赖wemol平台的登录状态
 */
export function handleNotLoggedIn() {
  // 不执行重定向，因为项目没有登录页面
  // 而是通过显示登录提示对话框让用户知道需要登录wemol平台
  console.log('请先登录wemol平台以使用此功能');
  // 这里可以选择抛出错误，让调用方处理
  throw new Error('用户未登录，请先登录wemol平台');
}

/**
 * 用户登录函数
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} loginType - 登录类型 ('user' 或 'sys')，决定调用哪个API
 * @returns {Promise<boolean>} - 登录结果，成功返回true，失败返回false
 */
export async function login(username, password, loginType = 'user') {
  try {
    // 根据登录类型选择API端点
    const apiEndpoint = loginType === 'sys' ? '/api/sys/login' : '/api/user/login';
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      credentials: 'include', // 确保发送cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Name: username,
        Passwd: password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // 检查登录是否成功
      if (data.success || data.code === 0 || data.status === 'success') {
        console.log('登录成功');
        return true;
      } else {
        console.error('登录失败:', data.message || '未知错误');
        throw new Error(data.message || '登录失败');
      }
    } else {
      const errorText = await response.text();
      console.error('登录请求失败:', errorText);
      throw new Error(`登录请求失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    throw error;
  }
}

/**
 * 退出登录函数
 * @returns {Promise<boolean>} - 退出登录结果
 */
export async function logout() {
  try {
    // 尝试清理cookie
    document.cookie = 'ant_uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'ant_uid_sys=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 调用退出登录API
    const response = await fetch('/api/user/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      console.log('退出登录成功');
      return true;
    } else {
      console.error('退出登录请求失败');
      return false;
    }
  } catch (error) {
    console.error('退出登录过程中发生错误:', error);
    return false;
  }
}

/**
 * 获取用户会话信息
 * @returns {Promise<Object|null>} - 会话信息，如果未登录则返回null
 */
export async function getUserSession() {
  try {
    // 先检查是否已登录
    if (!checkWemolLogin()) {
      return null;
    }
    
    // 调用接口获取用户会话信息
    const response = await fetch('/api/user/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.Data || null;
    }
    
    return null;
  } catch (error) {
    console.error('获取用户会话信息失败:', error);
    return null;
  }
}