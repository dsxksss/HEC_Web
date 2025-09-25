<template>
  <div class="chat-container">
    <!-- 左侧边栏 - 对话历史 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>{{ language === 'zh' ? '会话历史' : 'Conversation History' }}</h2>
        <button class="new-chat-btn" @click="startNewChat">
          {{ language === 'zh' ? '新建对话' : 'New Chat' }}
        </button>
      </div>
      <div class="chat-history">
        <div 
          v-for="(chat, index) in chatHistory" 
          :key="index"
          class="chat-item"
          @click="loadChat(index)"
        >
          <span>{{ chat.question.substring(0, 30) }}...</span>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="main-chat">
      <div class="chat-header">
        <div class="logo">
          <span class="logo-icon">🧪</span>
          <h1>HEC-PharmAI</h1>
        </div>
        <div class="header-controls">
          <select v-model="language" @change="changeLanguage">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <button class="theme-toggle">🌙</button>
        </div>
      </div>

      <div class="chat-messages">
        <!-- 欢迎消息 -->
        <div class="welcome-message">
          <div class="avatar">👨‍🔬</div>
          <div class="message-content">
            <p>{{ language === 'zh' ? '我是基于基本模型DeepSeek-R1的药剂师聊天大模型，此应用适用于药剂学通用知识和前沿研究问答，以下问题仅供参考：' : 'I am a pharmaceutical expert chat model based on DeepSeek-R1, suitable for general pharmaceutical knowledge and cutting-edge research Q&A. Here are some reference questions:' }}</p>
            
            <!-- 示例问题 -->
            <div class="example-questions">
              <div class="question-section">
                <h4>{{ language === 'zh' ? '单轮对话：' : 'Single-turn Dialogue:' }}</h4>
                <ul>
                  <li v-for="(q, idx) in exampleQuestions.singleTurn[language]" :key="idx" @click="sendExampleQuestion(q)">
                    {{ q }}
                  </li>
                </ul>
              </div>
              <div class="question-section">
                <h4>{{ language === 'zh' ? '固体分散体技术综述' : 'Review of Solid Dispersion Technology' }}</h4>
                <ul>
                  <li v-for="(q, idx) in exampleQuestions.multiTurn[language]" :key="idx" @click="sendExampleQuestion(q)">
                    {{ q }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话消息 -->
        <div 
          v-for="(message, index) in currentChat.messages" 
          :key="index"
          class="message" :class="message.role === 'user' ? 'user-message' : 'assistant-message'"
        >
          <div class="avatar">
            {{ message.role === 'user' ? '👤' : '👨‍🔬' }}
          </div>
          <div class="message-content">
            <p v-html="formatMessage(message.role === 'assistant' && message.content && typeof message.content === 'object' ? message.content.value : message.content)"></p>
            <!-- 引用部分 -->
            <div v-if="message.references && message.references.length > 0" class="references">
              <h4>{{ language === 'zh' ? '参考文献：' : 'References:' }}</h4>
              <ul>
                <li v-for="(ref, refIdx) in message.references" :key="refIdx">
                  {{ ref }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-message">
          <div class="avatar">👨‍🔬</div>
          <div class="message-content">
            <p>{{ language === 'zh' ? '思考中...' : 'Thinking...' }}</p>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <textarea 
            v-model="userInput" 
            @keydown.ctrl.enter="sendMessage"
            @keydown.shift.enter="sendMessage"
            :placeholder="language === 'zh' ? '请输入您的问题... (Ctrl+Enter 发送)' : 'Please enter your question... (Ctrl+Enter to send)'"
            :disabled="loading"
          ></textarea>
          <button 
            class="send-btn"
            @click="sendMessage"
            :disabled="loading || !userInput.trim()"
          >
            {{ language === 'zh' ? '发送' : 'Send' }}
          </button>
        </div>
        <div class="input-hint">
          {{ language === 'zh' ? '支持输入化合物SMILES、药剂学问题等' : 'Support input of compound SMILES, pharmaceutical questions, etc.' }}
        </div>
      </div>
    </div>

    <!-- 右侧边栏 - 知识库选择 -->
    <div class="sidebar right-sidebar">
      <div class="sidebar-header">
        <h2>{{ language === 'zh' ? '知识库选择' : 'Knowledge Base' }}</h2>
      </div>
      <div class="knowledge-bases">
        <div 
          class="kb-item" 
          :class="selectedKB === 'hec_rag_formulation' ? 'active' : ''"
          @click="selectKB('hec_rag_formulation')"
        >
          <h3>{{ language === 'zh' ? '制剂处方工艺知识库' : 'Formulation Process KB' }}</h3>
          <p>{{ language === 'zh' ? '适用于药物处方设计、工艺优化等' : 'For drug formulation design, process optimization, etc.' }}</p>
        </div>
        <div 
          class="kb-item" 
          :class="selectedKB === 'hec_rag_pharmaceutics' ? 'active' : ''"
          @click="selectKB('hec_rag_pharmaceutics')"
        >
          <h3>{{ language === 'zh' ? '药剂学综合知识库' : 'Pharmaceutics General KB' }}</h3>
          <p>{{ language === 'zh' ? '适用于药剂学基础理论、通用知识等' : 'For basic pharmaceutical theory, general knowledge, etc.' }}</p>
        </div>
      </div>
      
      <!-- 模型参数设置 -->
      <div class="model-params">
        <h3>{{ language === 'zh' ? '模型参数' : 'Model Parameters' }}</h3>
        <div class="param-item">
          <label>{{ language === 'zh' ? '模型名称' : 'Model Name' }}</label>
          <select v-model="modelParams.model_name">
            <option value="DeepSeek-R1">DeepSeek-R1</option>
            <option value="deepseek-chat">deepseek-chat</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
            <option value="Qwen3">Qwen3</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { EventSourcePolyfill } from 'event-source-polyfill';

export default {
  name: 'App',
  setup() {
    // 状态管理
    const language = ref('zh');
    const userInput = ref('');
    const loading = ref(false);
    const selectedKB = ref('hec_rag_formulation');
    const chatHistory = ref([]);
    const currentChat = reactive({
      messages: []
    });
    
    // 模型参数
    const modelParams = reactive({
      model_name: 'DeepSeek-R1'
    });

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
          '制备固体分散体剂型的主要目的是什么？',
          '采用固体分散体技术可使药物的溶出速率提升多少？',
          '固体分散体中溶解增强的可能机制有哪些？'
        ],
        en: [
          'What is the primary purpose of creating solid dispersion dosage forms?',
          'How much can the dissolution rate of a drug increase when using solid dispersions?',
          'What are the possible mechanisms of enhanced dissolution in solid dispersions?'
        ]
      }
    };

    // 初始化加载历史聊天记录
    onMounted(() => {
      loadChatHistory();
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
      // 处理ref对象，确保正确序列化
      const historyToSave = chatHistory.value.map(chat => ({
        question: chat.question,
        messages: chat.messages.map(msg => ({
          role: msg.role,
          content: msg.role === 'assistant' && msg.content && typeof msg.content === 'object' ? msg.content.value : msg.content,
          references: msg.references || []
        }))
      }));
      localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
    };

    // 开始新对话
    const startNewChat = () => {
      currentChat.messages = [];
      userInput.value = '';
    };

    // 加载历史对话
    const loadChat = (index) => {
      const messages = chatHistory.value[index].messages;
      currentChat.messages = messages.map(msg => {
        if (msg.role === 'assistant') {
          return {
            ...msg,
            content: ref(msg.content) // 将内容包装成ref以确保响应式
          };
        }
        return msg;
      });
    };

    // 切换语言
    const changeLanguage = () => {
      // 语言切换时可能需要的操作
    };

    // 选择知识库
    const selectKB = (kb) => {
      selectedKB.value = kb;
    };

    // 发送示例问题
    const sendExampleQuestion = (question) => {
      userInput.value = question;
      sendMessage();
    };

    // 发送消息
    const sendMessage = async () => {
      if (!userInput.value.trim() || loading.value) return;

      const question = userInput.value.trim();
      
      // 添加用户消息到当前对话
      currentChat.messages.push({
        role: 'user',
        content: question
      });

      // 清空输入框
      userInput.value = '';
      
      // 设置加载状态
      loading.value = true;

      try {
        // 准备API请求参数
        // 使用相对路径，利用Vite的代理配置处理跨域和重定向
        const apiUrl = '/api/v1/chat/completions';
        const apiKey = 'fastgpt-mKIZmHlk5l9WSEuyMlqfqpEXEb4OzTc0nd5zFJp3DAWX0zxbGddjySq3eC';
        
        // 构建消息历史
        let messages = [];
        
        // 根据知识库类型添加开场白
        if (selectedKB.value === 'hec_rag_formulation') {
          messages.push(
            { role: 'user', content: '这是一个模拟开场白' },
            { role: 'assistant', content: '\n我是一位制剂专家。' }
          );
        } else if (selectedKB.value === 'hec_rag_pharmaceutics') {
          messages.push(
            { role: 'user', content: '这是一个模拟开场白' },
            { role: 'assistant', content: '\n我是一位制剂专家。' }
          );
        }
        
        // 添加用户问题
        messages.push({ role: 'user', content: question });

        // 创建响应元素 - 使用ref确保content属性是响应式的
        const responseContent = ref('');
        const responseElement = {
          role: 'assistant',
          content: responseContent,
          references: []
        };
        
        currentChat.messages.push(responseElement);

        // 设置请求超时 - 延长到5分钟（300秒）以适应慢速响应
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 300秒超时

        try {
          // 使用fetch API处理SSE流式响应
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            stream: true,
            messages: messages,
            model: modelParams.model_name
          }),
          // 使用credentials: 'include'来确保在重定向过程中也发送凭证
          credentials: 'include',
          mode: 'cors',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP错误! 状态码: ${response.status}, 错误信息: ${errorText}`);
          throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            console.log('接收到的原始SSE数据块:', chunk);
            // 处理SSE数据格式
            const lines = chunk.split('\n');
            console.log('分割后的行数:', lines.length);
            
            for (const line of lines) {
              console.log('处理行:', line);
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                console.log('提取的数据内容:', data);
                
                if (data === '[DONE]') {
                  // 保存到历史记录
                  if (chatHistory.value.length >= 10) {
                    chatHistory.value.shift();
                  }
                  chatHistory.value.push({
                    question: question,
                    messages: [...currentChat.messages]
                  });
                  saveChatHistory();
                  console.log('流式响应结束，最终内容:', responseElement.content);
                  console.log('当前currentChat.messages数组:', currentChat.messages);
                  console.log('响应元素在数组中的位置:', currentChat.messages.indexOf(responseElement));
                  // 响应完成时设置loading为false
                  loading.value = false;
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  console.log('解析到的响应数据:', parsed);
                  
                  // 检查不同的响应格式
                  let content = null;
                  
                  // 格式1: choices[0].delta.reasoning_content (这个API实际使用的格式)
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.reasoning_content) {
                    content = parsed.choices[0].delta.reasoning_content;
                    console.log('使用格式1 - choices[0].delta.reasoning_content:', content);
                  }
                  // 格式2: choices[0].delta.content (标准OpenAI格式)
                  else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                    content = parsed.choices[0].delta.content;
                    console.log('使用格式2 - choices[0].delta.content:', content);
                  }
                  // 格式3: choices[0].text (替代格式)
                  else if (parsed.choices && parsed.choices[0] && parsed.choices[0].text) {
                    content = parsed.choices[0].text;
                    console.log('使用格式3 - choices[0].text:', content);
                  }
                  // 格式4: content字段直接返回
                  else if (parsed.content) {
                    content = parsed.content;
                    console.log('使用格式4 - content字段:', content);
                  }
                  // 格式5: data字段
                  else if (parsed.data) {
                    content = parsed.data;
                    console.log('使用格式5 - data字段:', content);
                  }
                  
                  if (content) {
                    responseContent.value += content;
                    // responseElement.content 已经是响应式的，不需要重新赋值
                    console.log('更新后的完整内容:', responseContent.value);
                  } else {
                    console.log('未找到有效的内容字段，响应结构:', parsed);
                  }
                  
                  // 处理可能的参考文献
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.references) {
                    responseElement.references = parsed.choices[0].delta.references;
                  }
                } catch (e) {
                  console.error('解析响应失败:', e, '响应内容:', data);
                }
              }
            }
          }
        }
        } catch (error) {
        clearTimeout(timeoutId);
        // 处理不同类型的错误
        if (error.name === 'AbortError') {
          console.error('请求超时: API响应时间超过300秒');
          throw new Error('请求超时，请检查网络连接或稍后再试');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('网络请求失败:', error);
          throw new Error('网络连接失败，请检查您的网络设置或稍后再试');
        } else {
          throw error;
        }
      }
      } catch (error) {
        console.error('发送消息失败:', error);
        loading.value = false;
        
        // 添加更详细的错误消息
        const errorMessage = {
          role: 'assistant',
          content: language.value === 'zh' 
            ? `抱歉，我暂时无法为您提供答案。错误信息：${error.message}。请稍后再试。` 
            : `Sorry, I cannot provide an answer for you at the moment. Error: ${error.message}. Please try again later.`,
          references: []
        };
        currentChat.messages.push(errorMessage);
        // 只有在错误情况下才设置loading为false
        loading.value = false;
      } finally {
        // 移除finally中的无条件设置loading为false
        // 确保只有在请求完成或出错时才设置loading为false
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

    return {
      language,
      userInput,
      loading,
      selectedKB,
      chatHistory,
      currentChat,
      modelParams,
      exampleQuestions,
      startNewChat,
      loadChat,
      changeLanguage,
      selectKB,
      sendExampleQuestion,
      sendMessage,
      formatMessage
    };
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.new-chat-btn {
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background-color: #4338ca;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  color: #4b5563;
}

.chat-item:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

/* 主聊天区域 */
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  min-width: 0;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 32px;
}

.logo h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-controls select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
}

.theme-toggle {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background-color: #f3f4f6;
}

/* 聊天消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #f9fafb;
}

.welcome-message {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.example-questions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.question-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.question-section li {
  padding: 10px 12px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
}

.question-section li:hover {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 800px;
}

.user-message {
  align-self: flex-end;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-message .message-content {
  background-color: #4f46e5;
  color: white;
}

.message-content p {
  margin: 0 0 8px 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.references {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.user-message .references {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.references h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.user-message .references h4 {
  color: rgba(255, 255, 255, 0.8);
}

.references ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.user-message .references ul {
  color: rgba(255, 255, 255, 0.6);
}

.references li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 加载状态 */
.loading-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 800px;
}

.loading-dots {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4f46e5;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 输入区域 */
.chat-input-area {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
}

.input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.input-container textarea {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  min-height: 60px;
  max-height: 200px;
  transition: border-color 0.2s;
}

.input-container textarea:focus {
  outline: none;
  border-color: #4f46e5;
}

.input-container textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.send-btn {
  padding: 12px 24px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-end;
}

.send-btn:hover:not(:disabled) {
  background-color: #4338ca;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

/* 右侧边栏 */
.right-sidebar {
  border-left: 1px solid #e5e7eb;
  border-right: none;
}

.knowledge-bases {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kb-item {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f9fafb;
}

.kb-item:hover {
  border-color: #4f46e5;
  background-color: #f0f9ff;
}

.kb-item.active {
  border-color: #4f46e5;
  background-color: #f0f9ff;
}

.kb-item h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.kb-item p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* 模型参数 */
.model-params {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.model-params h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #333;
}

.param-item {
  margin-bottom: 16px;
}

.param-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #4b5563;
}

.param-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
  }
  
  .right-sidebar {
    display: none;
  }
  
  .message {
    max-width: 100%;
  }
}
</style>
