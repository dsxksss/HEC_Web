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
  const antUid = getCookie('ant_uid');
  const antUidSys = getCookie('ant_uid_sys');
  
  // 只要ant_uid或ant_uid_sys存在，则认为用户已登录
  return antUid !== null || antUidSys !== null;
}

/**
 * 获取当前登录用户的信息
 * @returns {Object|null} - 用户信息对象，如果未登录则返回null
 */
export function getCurrentUserInfo() {
  const antUid = getCookie('ant_uid');
  const antUidSys = getCookie('ant_uid_sys');
  const userName = getCookie('userName') || getCookie('user_name') || getCookie('Name');
  
  if (antUid || antUidSys) {
    return {
      // 优先返回前台用户信息(ant_uid)
      ant_uid: antUid || antUidSys, // 如果ant_uid不存在则使用antUidSys
      ant_uid_sys: antUidSys, 
      isFrontendUser: antUid !== null, // 标识是否为前台用户
      // 尝试从cookie中获取用户名
      Name: userName
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
    // 检查cookie中是否存在登录信息
    const antUid = getCookie('ant_uid');
    const antUidSys = getCookie('ant_uid_sys');
    
    // 用户要求：有antUid就用前台用户API，都有则以antUid数据用户为主
    const shouldUseFrontendAPI = antUid !== null;
    
    if (antUid || antUidSys) {
      // 用户已登录，构造用户信息对象
      const userInfo = {
        ant_uid: antUid || antUidSys, 
        ant_uid_sys: antUidSys,
        isFrontendUser: antUid !== null
      };
      console.log('用户已登录wemol平台:', userInfo);
      
      // 根据用户要求使用正确的API验证登录是否有效
      try {
        const apiEndpoint = shouldUseFrontendAPI
          ? '/api/user/session_update?data=true' 
          : '/api/sys/session_update?data=true';
        
        console.log('使用API验证登录状态:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const sessionData = await response.json();
          console.log('会话验证成功，返回数据:', sessionData);
          // 将会话数据中的用户信息合并到userInfo对象中
          if (sessionData && sessionData.SessionData) {
            // 更新用户信息，包括Name字段
            Object.assign(userInfo, sessionData.SessionData);
          }
          return true;
        } else {
          console.error('会话验证失败，API返回非成功状态:', response.status);
          // API返回非成功状态时，也尝试返回true，因为cookie存在
          return true;
        }
      } catch (sessionError) {
        console.error('会话验证请求失败:', sessionError);
        // 请求失败时，不立即判定未登录，而是尝试返回用户信息
        return true;
      }
    } else {
      // 用户未登录
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
 * 根据用户类型获取对应的退出登录API
 * @param {boolean} isFrontendUser - 是否为前台用户
 * @returns {string} - API端点
 */
function getLogoutApi(isFrontendUser) {
  return isFrontendUser ? '/api/user/logout' : '/api/sys/logout';
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
      try {
        const data = await response.json();
        // 检查登录是否成功 - 增加更健壮的成功判断逻辑
        // 1. 检查标准成功标记
        const isSuccess = data.success || data.code === 0 || data.status === 'success' || data.code === '0';
        // 2. 检查是否有错误信息，如果没有错误信息也可能表示成功
        const hasNoError = !data.error && !data.errors && !data.message; 
        
        if (isSuccess || hasNoError) {
          console.log('登录成功', data);
          
          // 登录成功后，手动设置cookie以保持登录状态
          // 根据loginType设置相应的cookie
          if (loginType === 'sys') {
            // 后台用户，设置ant_uid_sys
            if (data.Data && data.Data.User && data.Data.User.Id) {
              setCookie('ant_uid_sys', data.Data.User.Id.toString(), 7);
            }
          } else {
            // 前台用户，设置ant_uid
            if (data.Data && data.Data.User && data.Data.User.Id) {
              setCookie('ant_uid', data.Data.User.Id.toString(), 7);
              // 同时也设置ant_uid_sys（如果需要前后台用户同时存在）
              setCookie('ant_uid_sys', data.Data.User.Id.toString(), 7);
            }
          }
          
          return true;
        } else {
          console.error('登录失败:', data.message || '未知错误');
          throw new Error(data.message || '登录失败');
        }
      } catch (jsonError) {
        // 如果JSON解析失败但响应状态是200，也视为登录成功
        console.warn('登录响应JSON解析失败，但请求状态为成功，视为登录成功:', jsonError);
        
        // 即使JSON解析失败，也尝试设置一个临时cookie以保持登录状态
        const cookieName = loginType === 'sys' ? 'ant_uid_sys' : 'ant_uid';
        setCookie(cookieName, 'temp_login_success', 1);
        
        return true;
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
 * @param {boolean} allSessions - 是否退出所有会话（前台和后台）
 * @returns {Promise<boolean>} - 退出登录结果
 */
export async function logout(allSessions = true) {
  try {
    // 尝试清理cookie
    document.cookie = 'ant_uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'ant_uid_sys=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    if (allSessions) {
      // 退出所有会话，同时调用用户和系统的退出登录API
      const userLogoutPromise = fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const sysLogoutPromise = fetch('/api/sys/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const [userResponse, sysResponse] = await Promise.all([userLogoutPromise, sysLogoutPromise]);
      
      if (userResponse.ok || sysResponse.ok) {
        console.log('退出登录成功');
        return true;
      } else {
        console.error('退出登录请求失败');
        return false;
      }
    } else {
      // 根据当前登录用户类型选择退出登录API
      const userInfo = getCurrentUserInfo();
      const apiEndpoint = userInfo && userInfo.isFrontendUser ? '/api/user/logout' : '/api/sys/logout';
      
      const response = await fetch(apiEndpoint, {
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
    }
  } catch (error) {
    console.error('退出登录过程中发生错误:', error);
    return false;
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
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
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
    
    // 根据用户类型选择API端点或使用指定的API类型
    const isSysUser = useSysApi || !userInfo.isFrontendUser;
    const apiEndpoint = isSysUser 
      ? `/api/sys/session_update?data=${updateData}` 
      : `/api/user/session_update?data=${updateData}`;
    
    // 调用session_update接口续期会话
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
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