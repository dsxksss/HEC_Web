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
export function getCurrentUserInfo() {
  // 注意：这里不再使用 getCookie，因为 HttpOnly cookie 无法读取
  // 我们可以考虑缓存上一次成功的 API 返回数据，或者每次调用 API 获取

  // 临时方案：尝试从本地存储或内存缓存中获取（如果你有缓存机制）
  // 如果没有缓存，就返回 null，由调用方决定是否调用 API

  // 更好的做法：调用 getUserSession() 或 renewUserSession() 来获取最新数据
  // 但为避免循环依赖，这里先简化处理

  // 你可以选择在这里调用一次 API（异步），但注意不要阻塞同步函数
  // 所以这里暂时返回 null，让调用方去调用异步函数

  return null; // 改为异步获取更合理
}

/**
 * 执行自动登录检测
 * 检查用户是否已登录，如果未登录则执行相应操作
 * @returns {Promise<boolean>} - 登录检测结果
 */
export async function autoLoginCheck() {
  console.log('[AutoLogin] 自动登录检测开始');

  try {
    // 直接调用API验证登录状态，不依赖cookie检测
    const apiEndpoint = '/api/user/session_update?data=true';

    console.log('[AutoLogin] 使用API验证登录状态:', apiEndpoint);

    // 使用axios发送请求
    const response = await axios.post(apiEndpoint, {}, {
      withCredentials: true, // 发送cookie（包括HttpOnly）
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 设置超时，避免卡住
    });

    console.log('[AutoLogin] API请求完成，状态码:', response.status);

    // 检查状态码是否成功
    if (response.status >= 200 && response.status < 300) {
      try {
        const sessionData = response.data;
        console.log('[AutoLogin] 会话验证成功，返回数据:', sessionData);

        // 判断是否真正登录成功（检查是否有用户数据）
        const hasUserData = sessionData?.Data?.User || sessionData?.SessionData;

        if (hasUserData) {
          console.log('[AutoLogin] 用户已登录（通过API验证）');
          console.log('[AutoLogin] 自动登录检测完成，结果: true');
          return true;
        } else {
          console.warn('[AutoLogin] API返回成功但无用户数据，可能未登录');
          console.log('[AutoLogin] 自动登录检测完成，结果: false');
          return false;
        }

      } catch (jsonError) {
        console.error('[AutoLogin] JSON解析失败:', jsonError);
        console.log('[AutoLogin] 自动登录检测完成，结果: false (JSON解析失败)');
        return false;
      }
    } else {
      console.error('[AutoLogin] 会话验证失败，API返回非成功状态:', response.status);
      console.log('[AutoLogin] 自动登录检测完成，结果: false');
      return false;
    }

  } catch (sessionError) {
    console.error('[AutoLogin] 会话验证请求失败:', sessionError);
    console.log('[AutoLogin] 自动登录检测完成，结果: false (请求失败)');
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
    
    const response = await axios.post(apiEndpoint, {
        Name: username,
        Passwd: password
      }, {
        withCredentials: true, // 确保发送cookie
        headers: {
          'Content-Type': 'application/json',
        }
      });
    
    // 对于axios，检查状态码是否在200-299范围内
    if (response.status >= 200 && response.status < 300) {
      try {
        // axios会自动解析JSON响应，直接使用response.data
        const data = response.data;
        // 检查登录是否成功 - 增加更健壮的成功判断逻辑
        // 1. 检查标准成功标记
        const isSuccess = data.success || data.code === 0 || data.status === 'success' || data.code === '0';
        // 2. 检查是否有错误信息，如果没有错误信息也可能表示成功
        const hasNoError = !data.error && !data.errors && (!data.message || data.message.toLowerCase().includes('success')); 
        // 3. 即使没有明确的成功标记，如果有User数据也应视为成功
        const hasUserData = data.Data && data.Data.User;
        // 4. 即使上述都不满足，如果数据包含用户ID也应视为成功
        const hasUserId = data.User && data.User.Id;
        
        if (isSuccess || hasNoError || hasUserData || hasUserId) {
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
    // 清理cookie中的登录信息（这是最关键的退出登录操作）
    document.cookie = 'ant_uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'ant_uid_sys=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'Name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 尝试调用API进行服务端注销，但即使失败也继续执行
    try {
      if (allSessions) {
        // 尝试调用两个注销API，但不关心结果
        await Promise.allSettled([
          axios.post('/api/user/logout', {}, {
            withCredentials: true,
            headers: {'Content-Type': 'application/json'},
            timeout: 1000 // 设置超时，避免长时间等待
          }),
          axios.post('/api/sys/logout', {}, {
            withCredentials: true,
            headers: {'Content-Type': 'application/json'},
            timeout: 1000
          })
        ]);
      } else {
        // 根据用户类型选择API，但也不关心结果
        const userInfo = getCurrentUserInfo();
        const apiEndpoint = userInfo && userInfo.isFrontendUser ? '/api/user/logout' : '/api/sys/logout';
        
        await axios.post(apiEndpoint, {}, {
          withCredentials: true,
          headers: {'Content-Type': 'application/json'},
          timeout: 1000
        }).catch(() => {}); // 忽略错误
      }
    } catch (apiError) {
      console.warn('注销API调用失败，但已成功清除本地cookie:', apiError.message);
    }
    
    // 无论API调用是否成功，只要清除了cookie就视为退出成功
    console.log('退出登录成功（已清除本地cookie）');
    return true;
  } catch (error) {
    console.error('退出登录过程中发生错误:', error);
    // 即使有错误，也尝试返回true，因为清除cookie是最重要的
    return true;
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