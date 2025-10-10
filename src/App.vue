<template>
  <div class="flex h-screen bg-gray-50 text-gray-800">
    <!-- 左侧边栏 - 对话历史 -->
    <div class="w-80 bg-gray-100 border-r border-gray-200 flex flex-col">
      <!-- 头部区域 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">HEC</span>
          </div>
          <h1 class="text-lg font-bold text-gray-800">药剂综合大模型</h1>
        </div>
        
        <!-- 新对话按钮 -->
        <div class="flex gap-2">
          <button 
            class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            :class="(loading || isTyping) ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-700'"
            @click="startNewChat"
            :disabled="loading || isTyping"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            新对话
          </button>
        </div>
      </div>
      
      <!-- 聊天历史列表 -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        <!-- 加载状态提示 -->
        <div v-if="loading || isTyping" class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-center gap-2 text-xs text-yellow-700">
            <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loading 
              ? (language === 'zh' ? '正在回答中，请稍候...' : 'Answering, please wait...')
              : (language === 'zh' ? '正在输出回答，请稍候...' : 'Outputting answer, please wait...')
            }}
          </div>
        </div>
        <div 
          v-for="(chat, index) in chatHistory" 
          :key="index"
          class="p-3 rounded-lg text-sm transition-all relative group"
          :class="[
            currentChatIndex === index 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-white border border-gray-200',
            (loading || isTyping)
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-50 hover:border-gray-300'
          ]"
          @click="(loading || isTyping) ? null : loadChat(index)"
        >
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-gray-800 truncate">{{ chat.question }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(chat.timestamp) }}</p>
            </div>
            <button 
              class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full hover:bg-red-100 flex items-center justify-center transition-all"
              :class="(loading || isTyping) ? 'cursor-not-allowed opacity-30' : ''"
              @click.stop="(loading || isTyping) ? null : deleteChat(index)"
              :disabled="loading || isTyping"
              title="删除对话"
            >
              <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 主区域头部 -->
      <div class="p-4 border-b border-gray-200 bg-white">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold text-gray-800">
              {{ currentChatTitle || '新对话' }}
            </h2>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-xs font-medium text-blue-600">①</span>
              </div>
              <span class="text-sm text-gray-500">{{ currentChat.messages.length }}条记录</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- 用户信息和退出按钮 -->
            <!-- <div v-if="currentUserInfo" class="flex items-center gap-2 mr-2">
              <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden relative">
                <img 
                  :src="`/api/user/avatar/${currentUserInfo.ant_uid}`" 
                  alt="用户头像" 
                  class="w-full h-full object-cover"
                  @error="onAvatarError"
                  ref="avatarImage"
                >
              </div>
              <span class="text-sm text-gray-700">{{ currentUserInfo.Name || `用户${currentUserInfo.ant_uid}` }}</span>
              <button 
                class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                @click="handleLogout"
                title="退出登录"
              >
                退出
              </button>
            </div> -->
          </div>
        </div>
        
        <!-- 语言选择卡片 -->
        <!-- <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">*语言/Language</span>
            <select 
              v-model="language" 
              @change="changeLanguage"
              class="ml-auto px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            
          </div>
        </div> -->
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3" ref="chatMessagesContainer">
        <!-- 欢迎消息 -->
        <div class="flex gap-3" v-if="currentChat.messages.length === 0">
          <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">HEC</span>
          </div>
          <div class="flex-1">
            <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs text-gray-500">{{ formatTime(new Date()) }}</span>
              </div>
              <p class="leading-relaxed text-gray-800 mb-4">
                {{ language === 'zh' 
                  ? '您好,我是基于集团本地部署 DeepSeek-R1 的药物制剂垂直大模型。此应用适用于药剂学通用知识与前沿研究问答。以下提问模板供参考:' 
                  : 'Hello, I am a pharmaceutical formulation vertical large model based on the group\'s local deployment of DeepSeek-R1. This application is suitable for general knowledge and cutting-edge research questions in pharmaceutics. The following question templates are provided for reference:' 
                }}
              </p>
              
              <!-- 示例问题 -->
              <div class="space-y-3">
                <div>
                  <h4 class="text-sm font-semibold mb-2 text-gray-800">{{ language === 'zh' ? '单轮对话:' : 'Single-turn dialogue:' }}</h4>
                  <ul class="space-y-1.5">
                    <li v-for="(q, idx) in exampleQuestions.singleTurn[language]" :key="idx" 
                        class="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all" 
                        @click="sendExampleQuestion(q)">
                      {{ q }}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 class="text-sm font-semibold mb-2 text-gray-800">{{ language === 'zh' ? '多轮对话:' : 'Multi-turn dialogue:' }}</h4>
                  <div class="space-y-2.5">
                    <div v-for="(section, sectionIdx) in exampleQuestions.multiTurn[language]" :key="sectionIdx">
                      <div class="text-xs font-medium text-gray-600 mb-1.5">{{ sectionIdx + 1 }}. {{ section.title }}</div>
                      <ul class="space-y-1.5">
                        <li v-for="(q, idx) in section.questions" :key="idx" 
                            class="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all" 
                            @click="sendExampleQuestion(q)">
                          {{ q }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户和助手的消息 -->
<template v-for="(message, index) in currentChat.messages" :key="index">
  <div 
    class="flex gap-4" 
    :class="message.role === 'user' ? 'justify-end' : ''"
  >
    <template v-if="message.role === 'assistant'">
      <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-sm">HEC</span>
      </div>
    </template>
    
    <div 
      class="max-w-[80%]"
      :class="message.role === 'user' ? 'order-1' : 'order-2 flex-1'"
    >
      <template v-if="loading && index === currentChat.messages.length - 1">
        <!-- 加载状态 - 思考动画 -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm message-appear">
          <div class="thinking-container">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <span class="text-sm text-gray-500 ml-2">{{ language === 'zh' ? '正在思考中...' : 'Thinking...' }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div 
          class="p-3 rounded-xl border shadow-sm group relative"
          :class="message.role === 'user' 
            ? 'bg-blue-600 text-white border-blue-600' 
            : 'bg-white border-gray-200'"
        >
          <!-- 思考过程手风琴 -->
          <div v-if="message.thinkingContent">
            <div class="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all">
              <button 
                @click="toggleThinking(index)"
                class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between text-left"
              >
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">思考过程</span>
                  <span class="text-xs text-gray-500">({{ message.thinkingContent.length }} 字符)</span>
                </div>
                <svg 
                  class="w-4 h-4 text-gray-600 transition-transform"
                  :class="expandedThinking.has(index) ? 'rotate-180' : ''"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div v-show="expandedThinking.has(index)" class="px-3 bg-white transition-all duration-200">
                <div class="text-sm text-gray-700 leading-relaxed font-mono" style="white-space: pre-line;">
                  {{ message.thinkingContent }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="leading-relaxed mt-2 markdown-content" v-html="renderMarkdown(message.content)"></div>
          <!-- 引用部分 - 现代简洁风格 -->
          <div v-if="message.references && message.references.length > 0" class="mt-2">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="text-xs text-blue-600 font-medium">📚</span>
              <span class="text-xs text-gray-500">{{ language === 'zh' ? '参考文献' : 'References' }}</span>
            </div>
            
            <div class="space-y-1.5">
              <div 
                v-for="(ref, refIdx) in message.references" 
                :key="refIdx"
                class="flex gap-2 text-xs leading-relaxed"
              >
                <span class="text-blue-600 font-medium min-w-[18px] mt-0.5">{{ refIdx + 1 }}.</span>
                <span class="text-gray-600 flex-1" v-html="formatMessage(ref)"></span>
              </div>
            </div>
          </div>
          <!-- 消息时间戳和操作按钮 -->
          <div class="flex items-center justify-between mt-1.5">
            <div class="text-[11px] text-gray-400" :class="message.role === 'user' ? 'text-white/60' : ''">
              {{ formatTime(message.timestamp || new Date()) }}
            </div>
            <!-- 右下角操作按钮 -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="p-1 rounded transition-colors"
                :class="message.role === 'user' ? 'hover:bg-blue-500' : 'hover:bg-gray-100'"
                @click="copyMessage(message.content)"
                title="复制"
              >
                <svg class="w-3 h-3 transition-colors" 
                     :class="message.role === 'user' ? 'text-white/80 hover:text-white' : 'text-gray-500'" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
              <button 
                v-if="message.role === 'assistant'"
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                @click="likeMessage(index)"
                title="点赞"
              >
                <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
              <button 
                class="p-1 rounded transition-colors"
                :class="message.role === 'user' ? 'hover:bg-blue-500' : 'hover:bg-gray-100'"
                @click="deleteMessage(index)"
                title="删除消息"
              >
                <svg class="w-3 h-3 transition-colors" 
                     :class="message.role === 'user' ? 'text-white/80 hover:text-white' : 'text-gray-500'" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <template v-if="message.role === 'user'">
      <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 order-0 flex-shrink-0 border border-gray-200">
        <img 
          v-if="currentUserInfo"
          :src="`/api/user/avatar/${currentUserInfo.ant_uid}`" 
          alt="用户头像" 
          class="w-full h-full object-cover"
          @error="onAvatarError"
        >
        <div v-else class="w-full h-full flex items-center justify-center text-sm text-gray-600">👤</div>
      </div>
    </template>
  </div>
</template>
      </div>

      <!-- 输入区域 -->
      <div class="p-3 border-t border-gray-200 bg-white">
        <div class="flex gap-3 items-center">
          <!-- 输入框 -->
          <div class="flex-1 relative">
            <textarea 
              v-model="userInput" 
              @keydown.ctrl.enter="sendMessage"
              @keydown.shift.enter="sendMessage"
              @keydown.escape="clearInput"
              :placeholder="language === 'zh' ? '请输入您的问题...' : 'Please enter your question...'"
              :disabled="loading"
              class="w-full p-3 border border-gray-300 rounded-lg text-sm leading-relaxed resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            ></textarea>
          </div>
          
          <!-- 发送/终止按钮 -->
          <button 
            v-if="!loading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 h-[44px]"
            @click="sendMessage"
            :disabled="loading || !userInput.trim()"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            {{ language === 'zh' ? '发送' : 'Send' }}
          </button>
          
          <!-- 终止按钮 (在发送按钮基础上显示) -->
          <button 
            v-else
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[44px]"
            @click="cancelRequest"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            {{ language === 'zh' ? '终止' : 'Stop' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 登录提示对话框 -->
  <div v-if="showLoginDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800">
          {{ language === 'zh' ? '请先登录' : 'Please Login First' }}
        </h3>
        <p class="text-gray-500 mt-2">
          {{ language === 'zh' ? '请输入您的账号密码以登录' : 'Please enter your username and password to log in' }}
        </p>
      </div>
      
      <!-- 登录类型切换Tabbar -->
      <div class="flex mb-6 border-b">
        <button 
          class="flex-1 py-2 text-center font-medium transition-colors" 
          :class="loginType === 'user' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
          @click="loginType = 'user'"
        >
          {{ language === 'zh' ? '用户登录' : 'User Login' }}
        </button>
        <button 
          class="flex-1 py-2 text-center font-medium transition-colors" 
          :class="loginType === 'sys' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
          @click="loginType = 'sys'"
        >
          {{ language === 'zh' ? '系统登录' : 'System Login' }}
        </button>
      </div>
      
      <!-- 登录表单 -->
      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ language === 'zh' ? '用户名' : 'Username' }}
          </label>
          <input 
            v-model="loginUsername" 
            type="text" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            :placeholder="language === 'zh' ? '请输入用户名' : 'Please enter username'"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ language === 'zh' ? '密码' : 'Password' }}
          </label>
          <input 
            v-model="loginPassword" 
            type="password" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            :placeholder="language === 'zh' ? '请输入密码' : 'Please enter password'"
          >
        </div>
        <div v-if="loginError" class="text-red-500 text-sm">
          {{ loginError }}
        </div>
      </div>
      
      <!-- 登录按钮 -->
      <div class="space-y-4">
        <button 
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          @click="handleLogin"
          :disabled="loginLoading"
        >
          <svg v-if="loginLoading" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1m3 0h10"></path>
          </svg>
          {{ language === 'zh' ? '登录' : 'Login' }}
        </button>
        <button 
          class="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          @click="closeLoginDialog"
          :disabled="loginLoading"
        >
          {{ language === 'zh' ? '取消' : 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { getCurrentUserInfo, autoLoginCheck,login, logout } from './login.js';
import { marked } from 'marked';
import hljs from 'highlight.js';

export default {
  name: 'App',
  setup() {
    // 配置 marked 和 highlight.js
    marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      breaks: true, // 支持换行
      gfm: true, // 支持GitHub风格的Markdown
    });

    // Markdown渲染函数
    const renderMarkdown = (content) => {
      if (!content) return '';
      try {
        return marked(content);
      } catch (error) {
        console.error('Markdown渲染错误:', error);
        return content; // 如果渲染失败，返回原始内容
      }
    };

    // 状态管理
    const language = ref('zh');
    const userInput = ref('');
    const loading = ref(false);
    const chatHistory = ref([]);
    const expandedThinking = ref(new Set()); // 记录哪些消息的思考过程是展开的
    const currentChat = reactive({
      messages: []
    });
    const chatMessagesContainer = ref(null);
    const currentChatIndex = ref(-1);
    const currentChatTitle = ref('');
    const isInThinkingMode = ref(false);
    const thinkingContent = ref('');
    const showThinking = ref(false);
    const controller = ref(null); // 用于取消请求的控制器
    const showLoginDialog = ref(false); // 控制登录对话框的显示
    const loginType = ref('user'); // 登录类型，'user' 或 'sys'
    const loginUsername = ref(''); // 登录用户名
    const loginPassword = ref(''); // 登录密码
    const loginError = ref(''); // 登录错误信息
    const loginLoading = ref(false); // 登录加载状态
    const currentUserInfo = ref(null); // 当前登录用户信息
    // 前端“打字机式”节流渲染（每秒输出固定字数）
    const renderQueue = ref('');
    const renderTimer = ref(null);
    const streamEnded = ref(false);
    const pendingQuestion = ref('');
    // 思考过程"打字机式"渲染队列
    const thinkingRenderQueue = ref('');
    // 跟踪是否正在打字机式输出
    const isTyping = ref(false);

    // 处理登录请求
    const handleLogin = async () => {
      // 重置错误信息
      loginError.value = '';
      
      // 简单的表单验证
      if (!loginUsername.value.trim()) {
        loginError.value = language.value === 'zh' ? '请输入用户名' : 'Please enter username';
        return;
      }
      if (!loginPassword.value.trim()) {
        loginError.value = language.value === 'zh' ? '请输入密码' : 'Please enter password';
        return;
      }
      
      // 设置登录加载状态
      loginLoading.value = true;
      
      try {
    const success = await login(loginUsername.value.trim(), loginPassword.value.trim(), loginType.value);
    if (success) {
      // ✅ 重新检测登录状态并获取用户信息
      const isLoggedIn = await autoLoginCheck();
      if (isLoggedIn) {
        currentUserInfo.value = await getCurrentUserInfo(); // ← 异步获取
        showLoginDialog.value = false;
        resetLoginForm();
      } else {
        loginError.value = '登录后验证失败，请重试';
      }
    } else {
      loginError.value = '登录请求失败';
    }
  } catch (error) {
    loginError.value = error.message || '登录异常';
  } finally {
    loginLoading.value = false;
  }
    };
    
    // 重置登录表单
    const resetLoginForm = () => {
      loginUsername.value = '';
      loginPassword.value = '';
      loginError.value = '';
      loginType.value = 'user';
    };

    // 初始化加载历史聊天记录
    onMounted(async () => {
  // 初始化语言：优先使用本地存储，其次浏览器首选语言
  const savedLang = localStorage.getItem('appLanguage');
  if (savedLang === 'zh' || savedLang === 'en') {
    language.value = savedLang;
  } else {
    const prefersZh = (navigator.language || navigator.userLanguage || 'zh').toLowerCase().startsWith('zh');
    language.value = prefersZh ? 'zh' : 'en';
  }
  document.documentElement.lang = language.value === 'zh' ? 'zh-CN' : 'en';
  console.log('[App] 开始自动登录检查...');
  loadChatHistory();

  try {
    const isLoggedIn = await autoLoginCheck();
    if (isLoggedIn) {
      // ✅ 异步获取用户信息
      currentUserInfo.value = await getCurrentUserInfo();
      console.log('[App] 用户已登录:', currentUserInfo.value);
    } else {
      showLoginDialog.value = true;
    }
  } catch (error) {
    console.error('[App] 自动登录异常:', error);
    showLoginDialog.value = true;
  }
});

    // 加载聊天历史
    const loadChatHistory = () => {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        chatHistory.value = JSON.parse(savedHistory);
      }
    };

    // 保存聊天历史
    const saveChatHistory = () => {
      const historyToSave = chatHistory.value.map(chat => ({
        question: chat.question,
        timestamp: chat.timestamp || new Date(),
        messages: chat.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          thinkingContent: msg.thinkingContent || '', // ← 保存思考内容
          references: msg.references || [],
          timestamp: msg.timestamp || new Date()
        }))
      }));
      localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
    };

    // 开始新对话
    const startNewChat = () => {
      // 重置所有状态
      currentChat.messages = [];
      userInput.value = '';
      currentChatIndex.value = -1;
      currentChatTitle.value = '';
      isInThinkingMode.value = false;
      thinkingContent.value = '';
      showThinking.value = false;
      loading.value = false;
      isTyping.value = false;
      
      // 停止打字机渲染
      if (renderTimer.value) {
        clearInterval(renderTimer.value);
        renderTimer.value = null;
      }
      renderQueue.value = '';
      thinkingRenderQueue.value = '';
      streamEnded.value = false;
      
      // 如果有正在进行的请求，取消它
      if (controller.value) {
        controller.value.abort();
        controller.value = null;
      }
    };

    // 加载历史对话
    const loadChat = (index) => {
      const chat = chatHistory.value[index];
      currentChat.messages = chat.messages.map(msg => ({
        ...msg,
        thinkingContent: msg.thinkingContent || '' // 确保字段存在
      }));
      currentChatIndex.value = index;
      currentChatTitle.value = chat.question;
      
      // 加载历史时，不自动展开思考过程
      expandedThinking.value.clear();
    };

    // 删除聊天记录
    const deleteChat = (index) => {
      if (confirm(language.value === 'zh' ? '确定要删除这条对话记录吗？' : 'Are you sure you want to delete this conversation?')) {
        chatHistory.value.splice(index, 1);
        saveChatHistory();
      }
    };

    // 示例问题
    const exampleQuestions = {
      singleTurn: {
        zh: [
          '影响半固体剂型溶出特征的关键因素有哪些？',
          '气体分散型剂型的优势是什么？'
        ],
        en: [
          'What are the key factors affecting the dissolution characteristics of semi-solid dosage forms?',
          'What are the advantages of gas dispersion dosage forms?'
        ]
      },
      multiTurn: {
        zh: [
          {
            title: '固体分散体技术综述',
            questions: [
              '制备固体分散体剂型的主要目的是什么？',
              '采用固体分散体技术可使药物的溶出速率提升多少？',
              '固体分散体中溶解增强的可能机制有哪些？'
            ]
          },
          {
            title: '纳米颗粒案例研究',
            questions: [
              '纳米颗粒在药物递送中的优势是什么？',
              '如何制备稳定的纳米颗粒制剂？'
            ]
          }
        ],
        en: [
          {
            title: 'Review of Solid Dispersion Technology',
            questions: [
              'What is the primary purpose of creating solid dispersion dosage forms?',
              'How much can the dissolution rate of a drug increase when using solid dispersions?',
              'What are the possible mechanisms of enhanced dissolution in solid dispersions?'
            ]
          },
          {
            title: 'Nanoparticle Case Study',
            questions: [
              'What are the advantages of nanoparticles in drug delivery?',
              'How to prepare stable nanoparticle formulations?'
            ]
          }
        ]
      }
    };

    // 切换语言
    const changeLanguage = () => {
      const lang = language.value === 'zh' ? 'zh' : 'en';
      localStorage.setItem('appLanguage', lang);
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    };

    // 发送示例问题
    const sendExampleQuestion = (question) => {
      userInput.value = question;
      sendMessage();
    };

    // 发送消息
const sendMessage = async () => {
      if (!userInput.value.trim() || loading.value) return;
      if (!currentUserInfo.value) {
        showLoginDialog.value = true;
        return;
      }

      // ===== 声明所有状态 =====
      let accumulatedContent = '';
      let accumulatedThinking = '';
      let accumulatedReferences = [];
      let isInThinking = false;
      let hasThinkingStarted = false;

      const question = userInput.value.trim();
      // 初始化节流渲染上下文
      pendingQuestion.value = question;
      renderQueue.value = '';
      if (renderTimer.value) { clearInterval(renderTimer.value); renderTimer.value = null; }
      streamEnded.value = false;
      thinkingRenderQueue.value = '';

      currentChat.messages.push({
        role: 'user',
        content: question,
        timestamp: new Date()
      });
      nextTick(() => scrollToBottom());

      userInput.value = '';
      loading.value = true;

      // 创建助手消息占位（包含 thinkingContent 字段）
      currentChat.messages.push({
        role: 'assistant',
        content: '',
        thinkingContent: '', // ← 新增字段
        references: [],
        timestamp: new Date()
      });

      const messages = [
        { role: 'user', content: '这是一个模拟开场白' },
        { role: 'assistant', content: '\n我是一位制剂专家。' },
        { role: 'user', content: question }
      ];

      const apiUrl = '/api/v1/chat/completions';
      const apiKey = 'fastgpt-mKIZmHlk5l9WSEuyMlqfqpEXEb4OzTc0nd5zFJp3DAWX0zxbGddjySq3eC';

      try {
        // 建立可中断的流式请求
        controller.value = new AbortController();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          signal: controller.value.signal,
          body: JSON.stringify({
            stream: true,
            messages,
            model: 'DeepSeek-R1'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let eventDataLines = [];
        // rAF 滚动（统一在下方只定义一次）
        // 打字机式渲染：每45ms输出1个字符（≈每秒22字）
        const TOTAL_CHARS_PER_TICK = 1;
        const TICK_MS = 45;
        // 安全分割函数：尽量避免拆分复合字符（emoji/变体等）
        const takeGraphemes = (input, count) => {
          try {
            if (typeof Intl !== 'undefined' && Intl.Segmenter) {
              const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
              const segments = Array.from(seg.segment(input));
              const taken = segments.slice(0, count).map(s => s.segment).join('');
              const remaining = segments.slice(count).map(s => s.segment).join('');
              return [taken, remaining];
            }
          } catch (e) {}
          // 回退：简单切分
          return [input.slice(0, count), input.slice(count)];
        };
        const startPacedRender = () => {
          if (renderTimer.value) return;
          isTyping.value = true; // 开始打字机输出
          renderTimer.value = setInterval(() => {
            try {
              // 如果无内容待输出（内容与思考均为空）
              if ((!renderQueue.value || renderQueue.value.length === 0) && (!thinkingRenderQueue.value || thinkingRenderQueue.value.length === 0)) {
                // 若后端已结束且队列空，执行最终保存
                if (streamEnded.value) {
                  chatHistory.value.push({
                    question: pendingQuestion.value,
                    messages: currentChat.messages.map(msg => ({
                      ...msg,
                      content: msg.content,
                      thinkingContent: msg.thinkingContent,
                      references: msg.references || []
                    })),
                    timestamp: new Date()
                  });
                  if (chatHistory.value.length > 10) chatHistory.value.shift();
                  saveChatHistory();
                  streamEnded.value = false;
                }
                clearInterval(renderTimer.value);
                renderTimer.value = null;
                isTyping.value = false; // 结束打字机输出
                return;
              }
              // 本次tick可输出总字符数（思考优先：先把思考输出完或用完当次配额）
              let remaining = TOTAL_CHARS_PER_TICK;

              if (thinkingRenderQueue.value && thinkingRenderQueue.value.length > 0) {
                const [thinkOut, restThinking] = takeGraphemes(thinkingRenderQueue.value, remaining);
                thinkingRenderQueue.value = restThinking;
                const lastIndex = currentChat.messages.length - 1;
                if (lastIndex >= 0 && currentChat.messages[lastIndex].role === 'assistant') {
                  const prev = currentChat.messages[lastIndex].thinkingContent || '';
                  currentChat.messages[lastIndex].thinkingContent = prev + thinkOut;
                }
                remaining -= thinkOut.length > 0 ? 1 : 0;
                // 若思考内容仍在输出，确保思考面板处于展开态
                if (thinkOut && thinkOut.length > 0) {
                  const idx = currentChat.messages.length - 1;
                  if (idx >= 0) {
                    expandedThinking.value.add(idx);
                  }
                }
              }

              // 再输出正式内容（剩余全部）
              if (remaining > 0 && renderQueue.value && renderQueue.value.length > 0) {
                const [contentOut, restContent] = takeGraphemes(renderQueue.value, remaining);
                renderQueue.value = restContent;
                const lastIndex = currentChat.messages.length - 1;
                if (lastIndex >= 0 && currentChat.messages[lastIndex].role === 'assistant') {
                  currentChat.messages[lastIndex].content += contentOut;
                }
              }

              scheduleScroll();
            } catch (e) {
              console.error('打字机式渲染错误:', e);
            }
          }, TICK_MS);
        };
        // 使用 rAF 合并滚动，避免每 token 强制布局（定义一次）
        let scrollScheduled = false;
        const scheduleScroll = () => {
          if (scrollScheduled) return;
          scrollScheduled = true;
          requestAnimationFrame(() => {
            scrollScheduled = false;
            scrollToBottom();
          });
        };

        // 基于 SSE 规范：多个 data: 行聚合为一个事件，空行作为事件分隔
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const rawLine = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            const line = rawLine.replace(/\r$/, '');

            // 空行 -> 完整事件（兼容某些服务端会将一个事件分多行 data: 发送）
            if (line === '') {
              if (eventDataLines.length > 0) {
                const dataStr = eventDataLines.join('');
                eventDataLines = [];

                if (dataStr === '[DONE]') {
                  // 仅标记结束，等待前端队列清空后统一保存
                  streamEnded.value = true;
                  loading.value = false;
                  // 若无队列待输出，立即触发一次渲染循环以保存
                  startPacedRender();
                  return;
                }

                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta || {};
                  const content = delta.content || '';
                  const reasoning = delta.reasoning_content || '';

                  // ===== 1. 处理思考模式 =====
                  if (reasoning === '<think>') {
                    isInThinking = true;
                    accumulatedThinking = '';
                    hasThinkingStarted = true;
                    // 自动展开当前消息的思考面板
                    const idx = currentChat.messages.length - 1;
                    if (idx >= 0) {
                      expandedThinking.value.add(idx);
                    }
                    continue;
                  } else if (reasoning === '</think>') {
                    isInThinking = false;
                    // 思考结束，自动收起面板（若队列也为空，则立即收起）
                    const idx = currentChat.messages.length - 1;
                    if (idx >= 0) {
                      expandedThinking.value.delete(idx);
                    }
                    continue;
                  }

                  if (isInThinking && reasoning) {
                    // 将思考过程推入前端渲染队列，按固定速率输出
                    thinkingRenderQueue.value += reasoning;
                    startPacedRender();
                    if (loading.value) loading.value = false;
                    continue;
                  }

                  // ===== 2. 处理正式回答 =====
                  if (content) {
                    // 将新增内容推入前端渲染队列，按固定速率输出
                    renderQueue.value += content;
                    startPacedRender();
                    if (loading.value) loading.value = false;
                  }

                  if (delta.references) {
                    accumulatedReferences = delta.references;
                    updateAssistantMessage(accumulatedContent, accumulatedThinking, accumulatedReferences);
                  }
                } catch (e) {
                  console.error('Parse error:', e, dataStr);
                }
              }
              continue;
            }

            // 注释行 (以冒号开头) 忽略
            if (line.startsWith(':')) {
              continue;
            }

            // 聚合 data: 行
            if (line.startsWith('data:')) {
              const dataPart = line.slice(5).trimStart();
              // 立即模式：绝大多数 LLM 流每个事件只包含一条 data 行
              // 为了更快的 UI 刷新，这里直接解析当前 data 行
              if (dataPart === '[DONE]') {
                streamEnded.value = true;
                loading.value = false;
                startPacedRender();
                return;
              }

              // 如果是 JSON 片段，尝试直接解析
              try {
                const parsed = JSON.parse(dataPart);
                const delta = parsed.choices?.[0]?.delta || {};
                const content = delta.content || '';
                const reasoning = delta.reasoning_content || '';

                if (reasoning === '<think>') {
                  isInThinking = true;
                  accumulatedThinking = '';
                  hasThinkingStarted = true;
                  const idx = currentChat.messages.length - 1;
                  if (idx >= 0) {
                    expandedThinking.value.add(idx);
                  }
                  continue;
                } else if (reasoning === '</think>') {
                  isInThinking = false;
                  const idx = currentChat.messages.length - 1;
                  if (idx >= 0) {
                    expandedThinking.value.delete(idx);
                  }
                  continue;
                }

                if (isInThinking && reasoning) {
                  thinkingRenderQueue.value += reasoning;
                  startPacedRender();
                  if (loading.value) loading.value = false;
                }

                if (content) {
                  renderQueue.value += content;
                  startPacedRender();
                  if (loading.value) loading.value = false;
                }

                if (delta.references) {
                  accumulatedReferences = delta.references;
                  updateAssistantMessage(accumulatedContent, accumulatedThinking, accumulatedReferences);
                }
              } catch (e) {
                // 如果本行不是完整 JSON（例如服务端将一个事件拆成多行 data），则退回到聚合模式
                eventDataLines.push(dataPart);
              }
            }
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        loading.value = false;
        
        // 检查是否为用户主动取消，如果是则不显示错误消息
        if (controller.value && controller.value.userCancelled) {
          console.log('用户主动取消请求，不显示错误消息');
        } else {
          const errorMsg = {
            role: 'assistant',
            content: language.value === 'zh'
              ? `网络错误：${error.message || '请检查网络或稍后重试'}`
              : `Network error: ${error.message || 'Please check your connection'}`,
            thinkingContent: '',
            references: [],
            timestamp: new Date()
          };
          currentChat.messages.push(errorMsg);
        }
      } finally {
        loading.value = false;
        // 清理控制器
        controller.value = null;
        // 若还有未清空的渲染队列，让计时器自行收尾
      }
    };

const updateAssistantMessage = (content, thinking, references) => {
  if (currentChat.messages.length === 0) return;
  
  const lastIndex = currentChat.messages.length - 1;
  const lastMessage = currentChat.messages[lastIndex];
  
  if (lastMessage.role === 'assistant') {
    // 👇 关键：直接赋值，不要防抖！
    currentChat.messages[lastIndex] = {
      ...lastMessage,
      content,
      thinkingContent: thinking,
      references
    };
    
    // 直接原位更新：Vue3 对数组下标赋值是响应式的，避免每次重建数组
  }
};

    // 取消当前请求
    const cancelRequest = () => {
      if (controller.value) {
        // 标记为用户主动取消，避免显示网络错误
        controller.value.userCancelled = true;
        
        // 使用axios的取消方式
        if (controller.value.cancel) {
          controller.value.cancel('Request cancelled');
        } else if (controller.value.abort) {
          // 向后兼容，保留原有的abort方法
          controller.value.abort();
        }
        loading.value = false;
        // 停止前端节流渲染并清空队列
        if (renderTimer.value) { clearInterval(renderTimer.value); renderTimer.value = null; }
        renderQueue.value = '';
        thinkingRenderQueue.value = '';
        streamEnded.value = false;
        isTyping.value = false; // 重置打字机状态
        // 移除最后添加的助手消息（如果有的话）
        if (currentChat.messages.length > 0 && 
            currentChat.messages[currentChat.messages.length - 1].role === 'assistant') {
          currentChat.messages.pop();
        }
        // 添加一条简洁的终止提示消息
        const cancelMessage = {
          role: 'assistant',
          content: language.value === 'zh' ? '对话终止' : 'Conversation terminated',
          references: [],
          timestamp: new Date()
        };
        currentChat.messages.push(cancelMessage);
      }
    };

    // 格式化消息内容（支持简单的Markdown）
    const formatMessage = (content) => {
      console.log('formatMessage接收到的内容:', content);
      if (!content || content.trim() === '') {
        console.log('内容为空，返回空字符串');
        return '';
      }
      
      // 简单的Markdown解析
      let formatted = content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      
      console.log('格式化后的内容:', formatted);
      return formatted;
    };

    // 滚动到底部
    const scrollToBottom = () => {
      if (chatMessagesContainer.value) {
        chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
      }
    };

    // 清空输入框
    const clearInput = () => {
      userInput.value = '';
    };

    // 格式化时间
    const formatTime = (date) => {
      const now = new Date(date);
      return now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 格式化日期
    const formatDate = (date) => {
      const now = new Date(date);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    };

    // 复制消息
    const copyMessage = async (content) => {
      try {
        await navigator.clipboard.writeText(content);
        // 可以添加提示
      } catch (err) {
        console.error('复制失败:', err);
      }
    };

    // 复制输入内容
    const copyInput = async () => {
      try {
        await navigator.clipboard.writeText(userInput.value);
      } catch (err) {
        console.error('复制失败:', err);
      }
    };

    // 重新生成响应
    const regenerateResponse = () => {
      if (currentChat.messages.length > 0) {
        const lastUserMessage = currentChat.messages.filter(msg => msg.role === 'user').pop();
        if (lastUserMessage) {
          userInput.value = lastUserMessage.content;
          sendMessage();
        }
      }
    };
    
    const toggleThinking = (index) => {
      if (expandedThinking.value.has(index)) {
        expandedThinking.value.delete(index);
      } else {
        expandedThinking.value.add(index);
      }
    };

    // 获取用户名首字母（用于用户头像显示）
    const getInitials = (userId) => {
      if (!userId) return '👤';
      // 简单处理：如果userId是数字，返回前两位
      if (!isNaN(userId)) {
        return userId.toString().slice(0, 2);
      }
      // 如果是字符串，返回首字母
      return userId.charAt(0).toUpperCase();
    };
    
    // 处理退出登录
    const handleLogout = async () => {
      if (confirm(language.value === 'zh' ? '确定要退出登录吗？' : 'Are you sure you want to log out?')) {
        try {
          // 调用退出登录函数
          const success = await logout(true);
          
          if (success) {
            // 清除用户信息
            currentUserInfo.value = null;
            
            // 清空当前对话
            currentChat.messages = [];
            
            // 显示登录对话框
            showLoginDialog.value = true;
            
            console.log('用户已成功退出登录');
          } else {
            console.error('退出登录失败');
          }
        } catch (error) {
          console.error('退出登录过程中发生错误:', error);
        }
      }
    };

    // 点赞消息
    const likeMessage = (index) => {
      // 实现点赞功能
      console.log('点赞消息:', index);
    };

    // 删除消息
    const deleteMessage = (index) => {
      if (confirm('确定要删除这条消息吗？')) {
        currentChat.messages.splice(index, 1);
        // 保存更新后的聊天记录
        saveChatHistory();
        console.log('删除消息:', index);
      }
    };

    // 关闭登录对话框
    const closeLoginDialog = () => {
      showLoginDialog.value = false;
    };

    // 处理头像加载失败
    const onAvatarError = (event) => {
      // 设置图片为透明，这样下面的文字就能显示出来
      event.target.style.opacity = '0';
      console.log('用户头像加载失败，显示首字母代替');
    };

    // 导出对话功能已移除

    

    return {
      language,
      userInput,
      loading,
      chatHistory,
      currentChat,
      currentChatIndex,
      currentChatTitle,
      isInThinkingMode,
      thinkingContent,
      showThinking,
      exampleQuestions,
      startNewChat,
      loadChat,
      changeLanguage,
      sendExampleQuestion,
      sendMessage,
      formatMessage,
      chatMessagesContainer,
      clearInput,
      deleteChat,
      formatTime,
      formatDate,
      copyMessage,
      copyInput,
      regenerateResponse,
      likeMessage,
      deleteMessage,
      cancelRequest,
      showLoginDialog,
      closeLoginDialog,
      onAvatarError,
      loginType,
      loginUsername,
      loginPassword,
      loginError,
      loginLoading,
      handleLogin,
      currentUserInfo,
      getInitials,
      handleLogout,
      expandedThinking,
      toggleThinking,
      saveChatHistory,
      isTyping,
      renderMarkdown
    };
  }
};
</script>
