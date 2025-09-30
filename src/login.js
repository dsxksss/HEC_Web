// wemol平台登录检测功能
import axios from 'axios';

/**
 * 从cookie中获取指定名称的值
 * @param {string} name - cookie名称
 * @returns {string|null} - cookie值，如果不存在则返回null
 */
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
 * 检测cookie是否存在（不读取值，只检查存在性）
 * 当cookie可能设置了HttpOnly属性时，可以通过document.cookie的字符串包含性来检测
 * @param {string} name - cookie名称
 * @returns {boolean} - cookie是否存在
 */
export function hasCookie(name) {
  // 更简单的检测方法，通过检查document.cookie字符串是否包含cookie名称加上等号
  // 这种方法可以检测到HttpOnly cookie（只要不是完全限制了前端访问）
  const cookieString = document.cookie;
  // 确保匹配完整的cookie名称，避免部分匹配
  return cookieString.includes(`${name}=`) || 
         cookieString.includes(`; ${name}=`);
}

/**
 * 设置cookie
 * @param {string} name - cookie名称
 * @param {string} value - cookie值
 * @param {number} days - 过期天数
 */
export function setCookie(name, value, days = 7) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;`;
}

/**
 * 检查用户是否已登录wemol平台
 * @returns {boolean} - 用户是否已登录
 */
export function checkWemolLogin() {
  // 不再依赖cookie，而是依赖当前用户信息缓存或API调用
  // 简单实现：尝试获取当前用户信息
  const userInfo = getCurrentUserInfo();
  return !!userInfo;
}

/**
 * 获取当前登录用户的信息
 * @returns {Object|null} - 用户信息对象，如果未登录则返回null
 */
export async function getCurrentUserInfo() {
  try {
    const res = await axios.post('/api/user/session_update?data=true', {}, {
      withCredentials: true
    });
    if (res.status === 200) {
      const user = res.data?.Data?.User || res.data?.SessionData;
      if (user) {
        return {
          ant_uid: user.Id || user.ant_uid,
          Name: user.Name || user.name || 'HEC用户',
          isFrontendUser: true // 假设都是前台用户
        };
      }
    }
  } catch (e) {
    console.error('[Login] 获取用户信息失败:', e);
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
    const res = await axios.post('/api/user/session_update?data=true', {}, {
      withCredentials: true,
      timeout: 5000
    });
    // 只要返回 200 且包含用户数据，就认为已登录
    return res.status === 200 && (res.data?.Data?.User || res.data?.SessionData);
  } catch (e) {
    console.warn('[Login] 自动登录检测失败:', e.message);
    return false;
  }
}


/**
 * 根据用户类型获取对应的退出登录API
 * @param {boolean} isFrontendUser - 是否为前台用户
 * @returns {string} - API端点
 */
function getLogoutApi(isFrontendUser) {
  return isFrontendUser ? '/api/user/quit' : '/api/user/quit';
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
  const endpoint = loginType === 'sys' ? '/api/sys/login' : '/api/user/login';
  const res = await axios.post(endpoint, {
    Name: username,
    Passwd: password
  }, { withCredentials: true });

  // 只要状态码 2xx 就认为成功（后端会设置 HttpOnly Cookie）
  return res.status >= 200 && res.status < 300;
}

/**
 * 退出登录函数
 * @param {boolean} allSessions - 是否退出所有会话（前台和后台）
 * @returns {Promise<boolean>} - 退出登录结果
 */
export async function logout(allSessions = true) {
  try {
    if (allSessions) {
      await Promise.allSettled([
        axios.post('/api/user/quit', {}, { withCredentials: true }),
        axios.post('/api/user/quit', {}, { withCredentials: true })
      ]);
    } else {
      await axios.post('/api/user/quit', {}, { withCredentials: true });
    }
    return true;
  } catch (e) {
    console.warn('[Login] 注销接口调用失败，但可能已生效:', e.message);
    return true; // 仍视为成功
  }
}
/**
 * 获取用户会话信息
 * @param {boolean} useSysApi - 是否使用系统API（后台用户）
 * @returns {Promise<Object|null>} - 会话信息，如果未登录则返回null
 */
export async function getUserSession(useSysApi = false) {
  try {
    // 先检查是否已登录
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      return null;
    }
    
    // 根据用户类型选择API端点或使用指定的API类型
    const isSysUser = useSysApi || !userInfo.isFrontendUser;
    const apiEndpoint = isSysUser ? '/api/sys/session_data' : '/api/user/session_data';
    
    // 调用新的session_data接口获取用户会话信息
    const response = await axios.post(apiEndpoint, {}, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // 对于axios，检查状态码是否在200-299范围内
        if (response.status >= 200 && response.status < 300) {
          // axios会自动解析JSON响应
          const data = response.data;
          // 返回SessionData字段，这是用户要求的格式
          return data.SessionData || null;
        }
    
    return null;
  } catch (error) {
    console.error('获取用户会话信息失败:', error);
    return null;
  }
}

/**
 * 续期用户会话过期时间
 * @param {boolean} updateData - 是否同时更新用户信息
 * @param {boolean} useSysApi - 是否使用系统API（后台用户）
 * @returns {Promise<Object|null>} - 会话信息，如果续期失败则返回null
 */
export async function renewUserSession(updateData = false, useSysApi = false) {
  try {
    // 先检查是否已登录
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      console.error('用户未登录，无法续期会话');
      return null;
    }
    
    // 用户要求：所有情况都使用/api/user/session_update接口
    const apiEndpoint = `/api/user/session_update?data=${updateData}`;
    
    // 调用session_update接口续期会话
    const response = await axios.post(apiEndpoint, {}, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // 对于axios，检查状态码是否在200-299范围内
    if (response.status >= 200 && response.status < 300) {
      // axios会自动解析JSON响应
      const data = response.data;
      console.log(`会话续期${updateData ? '并更新信息' : ''}成功`);
      // 返回SessionData字段，这是用户要求的格式
      return data.SessionData || null;
    }
    
    console.error('会话续期请求失败');
    return null;
  } catch (error) {
    console.error('会话续期过程中发生错误:', error);
    return null;
  }
}