// const { ipcRenderer } = require('electron'); // 不再需要直接使用ipcRenderer
// const WebSocket = require('ws'); // 不再需要ws客户端

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const restartBtn = document.getElementById('restartBtn'); // 添加重启按钮引用
const listenPortInput = document.getElementById('listenPort');
const accessTokenInput = document.getElementById('accessToken');
const statusBar = document.getElementById('status-bar');
const clientStatusSpan = document.getElementById('client-status');
const serverLogContainer = document.getElementById('server-log-container');
const serverLogDisplay = document.getElementById('server-log-display'); // 新的服务器日志展示区
const eventLogContainer = document.getElementById('event-log-container');
const showHeartbeatCheckbox = document.getElementById('showHeartbeat'); // 获取复选框元素

// 机器人状态元素
const botAccountId = document.getElementById('bot-account-id');
const botNickname = document.getElementById('bot-nickname');
const botLoginStatus = document.getElementById('bot-login-status');
const deviceType = document.getElementById('device-type');
const deviceOnlineStatus = document.getElementById('device-online-status');
const protocolVersion = document.getElementById('protocol-version');

let showHeartbeatState = true; // Add a variable to hold the state
let configLoaded = false; // Add a flag to track if config is loaded
let listenersInitialized = false; // Add flag for listener initialization

// 群聊管理元素
const groupIdInput = document.getElementById('groupIdInput');
const addGroupBtn = document.getElementById('addGroupBtn');
const refreshGroupsBtn = document.getElementById('refreshGroupsBtn');
const groupTableBody = document.getElementById('groupTableBody');
const getGroupListBtn = document.getElementById('getGroupListBtn');

// 插件管理相关元素
const pluginTableBody = document.getElementById('pluginTableBody');
const pluginStatus = document.getElementById('plugin-status');

// 刷新机器人状态按钮
const refreshBotStatusBtn = document.getElementById('refreshBotStatus');

// 获取UI元素
const groupJsonEditor = document.getElementById('groupJsonEditor');
const groupJsonStatus = document.getElementById('groupJsonStatus');
const loadGroupJsonBtn = document.getElementById('loadGroupJsonBtn');
const saveGroupJsonBtn = document.getElementById('saveGroupJsonBtn');
const editGroupJsonBtn = document.getElementById('editGroupJsonBtn');
const cancelEditJsonBtn = document.getElementById('cancelEditJsonBtn');
const groupJsonEditorContainer = document.getElementById('groupJsonEditorContainer');

// 插件商店相关元素
const pluginStoreContainer = document.getElementById('plugin-store-container');
const storePluginsContainer = document.getElementById('storePluginsContainer');
const storeStatus = document.getElementById('store-status');
const openPluginStoreBtn = document.getElementById('openPluginStoreBtn');
const closePluginStoreBtn = document.getElementById('closePluginStoreBtn');
const pluginSearchInput = document.getElementById('pluginSearchInput');
const pluginTypeFilter = document.getElementById('pluginTypeFilter');
const refreshStoreBtn = document.getElementById('refreshStoreBtn');

// --- 群聊管理功能 ---
let groupConfig = { groups: {} };

// API模块使用的变量（初始化为null，不影响其他功能）
let api = null;

// 获取API对象，包括错误处理
function getApi() {
    try {
        if (!api && window.electronAPI) {
            api = window.electronAPI.api;
            if (api) {
                console.log('API对象初始化完成');
            } else {
                console.warn('API对象未定义，可能是模块加载失败');
                // 创建一个简单的API对象，确保基本功能可用
                api = {
                    group: {
                        getGroupList: async () => await window.electronAPI.callOneBotApi('get_group_list', {})
                    },
                    call: async (action, params = {}) => {
                        return await window.electronAPI.callOneBotApi(action, params);
                    }
                };
            }
        }
        return api;
    } catch (error) {
        console.error('获取API对象失败:', error);
        return null;
    }
}

// --- 配置加载与保存 ---
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        listenPortInput.value = config.port || '8080';
        accessTokenInput.value = config.accessToken || '';
        showHeartbeatState = config.showHeartbeat !== false; 
        showHeartbeatCheckbox.checked = showHeartbeatState;
        configLoaded = true; // Set flag to true after config is loaded and applied
    } catch (error) {
        console.error('Failed to load config:', error);
        configLoaded = true; 
    }
}

// 保存配置到文件
async function saveConfig() {
    try {
        console.log('正在保存配置...');
        const config = getConfig();
        if (!config) {
            console.error('无法获取配置对象');
            throw new Error('无法获取配置对象');
        }
        
        // 发送保存请求
        await window.electronAPI.saveConfig(config);
        console.log('配置保存成功:', config);
        
        // 为了调试，显示在日志中
        addServerLog(`配置已更新: 端口=${config.port}, 心跳显示=${config.showHeartbeat}`, 'info');
        
        return config;
    } catch (error) {
        console.error('保存配置失败:', error);
        addServerLog(`无法保存配置: ${error.message}`, 'error');
        return null;
    }
}

// 读取页面上的配置
function getConfig() {
    try {
        // 获取正确的DOM元素
        if (!listenPortInput || !accessTokenInput || !showHeartbeatCheckbox) {
            throw new Error('无法找到配置表单元素');
        }
        
        // 读取配置 - 与config.json匹配的结构
        const config = {
            port: parseInt(listenPortInput.value, 10),
            accessToken: accessTokenInput.value.trim(),
            showHeartbeat: showHeartbeatCheckbox.checked
        };
        
        // 验证配置
        if (isNaN(config.port) || config.port <= 0) config.port = 8080;
        
        return config;
    } catch (error) {
        console.error('读取配置错误:', error);
        return null;
    }
}

// --- 日志处理 ---
function addLog(container, message, type = 'info') {
    try {
        // 检查容器元素是否存在
        if (!container) {
            console.error('日志容器不存在，无法添加日志:', message);
            return;
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = `[${new Date().toLocaleTimeString()}]`;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        // 根据类型添加样式
        if (type === 'error') {
            messageSpan.classList.add('log-type-error');
        } else if (container === eventLogContainer && typeof message === 'object') {
            // 尝试为事件日志根据post_type添加样式
            const postType = message.post_type;
            if (postType) {
                messageSpan.classList.add(`log-type-${postType}`); // e.g., log-type-message, log-type-meta_event
            } else if(message.echo) { // 假设带echo的是API响应
                messageSpan.classList.add(`log-type-api`);
            }
            messageSpan.textContent = JSON.stringify(message); // 对象转字符串
        } else if(type !== 'info') { // 其他自定义类型
            messageSpan.classList.add(`log-type-${type}`);
        }

        logEntry.appendChild(timeSpan);
        logEntry.appendChild(messageSpan);

        container.appendChild(logEntry);
        container.scrollTop = container.scrollHeight; // 自动滚动到底部
    } catch (error) {
        console.error('添加日志失败:', error, '原始消息:', message);
    }
}

function addServerLog(message, type = 'info') {
    try {
        // 同时输出到控制台，确保即使DOM元素不存在也能看到日志
        console.log(`[服务器日志] ${message}`);
        
        // 添加到主页的服务器日志区域
        if (serverLogContainer) {
            addLog(serverLogContainer, message, type);
        }
        
        // 同时添加到专门的服务器日志页面
        if (serverLogDisplay) {
            addLog(serverLogDisplay, message, type);
        }
    } catch (error) {
        console.error('添加服务器日志失败:', error, '原始消息:', message);
    }
}

function addEventLog(message) {
    try {
        // 检查是否已加载配置
        if (!configLoaded) {
            console.log('[addEventLog] 配置未加载，跳过记录事件日志');
            return; 
        }
        
        // 检查事件日志容器是否存在
        if (!eventLogContainer) {
            console.error('[addEventLog] 事件日志容器不存在，无法添加日志');
            return;
        }
        
        // 只处理消息类型的事件
        if (typeof message !== 'object' || message.post_type !== 'message') {
            // 可以选择完全不显示非消息事件，或者以其他格式显示
            return;
        }
        
        // 过滤心跳消息
        const isHeartbeat = message.meta_event_type === 'heartbeat';
        if (isHeartbeat && !showHeartbeatState) {
            return;
        }
        
        // 获取消息类型、群名称、发送者信息等
        let formattedMessage = '';
        
        if (message.message_type === 'group') {
            // 群聊消息
            const groupId = message.group_id || '未知群号';
            const groupName = getGroupName(groupId);
            const senderName = message.sender?.nickname || '未知用户';
            const senderId = message.user_id || '未知';
            const content = message.raw_message || message.message || '';
            
            formattedMessage = `[INFO] 接收 <- 群聊 [${groupName}(${groupId})] [${senderName}(${senderId})] ${content}`;
        } else if (message.message_type === 'private') {
            // 私聊消息
            const senderName = message.sender?.nickname || '未知用户';
            const senderId = message.user_id || '未知';
            const content = message.raw_message || message.message || '';
            
            formattedMessage = `[INFO] 接收 <- 私聊 [${senderName}(${senderId})] ${content}`;
        } else {
            // 其他类型消息，可以不显示或使用默认格式
            return;
        }
        
        // 创建日志条目
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = `[${new Date().toLocaleTimeString()}]`;

        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-type-message';
        messageSpan.textContent = formattedMessage;

        // 去掉时间戳，因为格式中已经包含了[INFO]类型标记
        // logEntry.appendChild(timeSpan);
        logEntry.appendChild(messageSpan);

        eventLogContainer.appendChild(logEntry);
        eventLogContainer.scrollTop = eventLogContainer.scrollHeight; // 自动滚动到底部
        
        // 输出到控制台以便调试
        console.log(`[事件日志] ${formattedMessage}`);
    } catch (error) {
        console.error('添加事件日志失败:', error, '原始消息:', message);
    }
}

// 根据群ID获取群名称的辅助函数
function getGroupName(groupId) {
    try {
        // 如果有群组配置数据，尝试从中获取群名称
        if (groupConfig && groupConfig.groups && groupConfig.groups[groupId]) {
            return groupConfig.groups[groupId].name || `群${groupId}`;
        }
        return `群${groupId}`;
    } catch (error) {
        console.error('获取群名称出错:', error);
        return `群${groupId}`;
    }
}

// --- 机器人状态处理 ---
function updateBotInfo(data) {
    if (!data) return;
    
    try {
        // 更新账号信息
        if (data.user_id && botAccountId) {
            botAccountId.textContent = data.user_id;
        }
        
        if (data.nickname && botNickname) {
            botNickname.textContent = data.nickname;
        }
        
        // 在线状态判断逻辑调整：只要获取到账号信息就视为在线
        // NapCatQQ API可能不直接提供online字段，但既然能获取到账号信息就说明已登录
        if (botLoginStatus) {
            // 只要能获取到账号ID和昵称，就认为是已登录状态
            const isLoggedIn = data.user_id && data.nickname;
            const status = isLoggedIn ? '已登录' : '未登录';
            botLoginStatus.textContent = status;
            botLoginStatus.style.color = isLoggedIn ? '#155724' : '#721c24';
        }
        
        // 更新设备信息
        if (data.device_type && deviceType) {
            deviceType.textContent = data.device_type;
        } else if (data.app_name && deviceType) {
            deviceType.textContent = data.app_name;
        }
        
        if (deviceOnlineStatus) {
            // 同样，如果能获取到基本信息，就认为设备在线
            const isOnline = data.user_id && (data.device_type || data.app_name);
            deviceOnlineStatus.textContent = isOnline ? '在线' : '离线';
            deviceOnlineStatus.style.color = isOnline ? '#155724' : '#721c24';
        }
        
        if (data.protocol_version && protocolVersion) {
            protocolVersion.textContent = data.protocol_version;
        } else if (data.version && protocolVersion) {
            protocolVersion.textContent = data.version;
        }
        
        addServerLog(`已更新机器人状态信息: ID=${data.user_id}, 昵称=${data.nickname}`, 'info');
    } catch (error) {
        console.error('更新机器人信息失败:', error);
        addServerLog(`更新机器人信息失败: ${error.message}`, 'error');
    }
}

// 获取机器人状态信息
async function fetchBotStatus() {
    try {
        const serverStatus = window.serverStatus;
        if (!serverStatus || !serverStatus.isRunning) {
            addServerLog('服务器未运行，无法获取机器人状态', 'error');
            return;
        }
        
        // 获取API对象
        const api = getApi();
        if (!api) {
            addServerLog('API对象未初始化，无法获取机器人状态', 'error');
            return;
        }
        
        // 调用get_login_info API
        const loginInfo = await api.call('get_login_info');
        addServerLog(`获取登录信息响应: ${JSON.stringify(loginInfo)}`, 'info');
        
        if (loginInfo && loginInfo.data) {
            updateBotInfo(loginInfo.data);
            
            // 尝试获取更多设备信息
            try {
                const versionInfo = await api.call('get_version_info');
                addServerLog(`获取版本信息响应: ${JSON.stringify(versionInfo)}`, 'info');
                
                if (versionInfo && versionInfo.data) {
                    // 合并版本信息到状态数据中
                    updateBotInfo({
                        ...loginInfo.data,
                        ...versionInfo.data
                    });
                }
            } catch (e) {
                console.error('获取版本信息失败:', e);
                // 继续使用已有的登录信息
            }
        } else {
            addServerLog('获取机器人登录信息失败', 'error');
        }
    } catch (error) {
        console.error('获取机器人状态失败:', error);
        addServerLog(`获取机器人状态失败: ${error.message}`, 'error');
    }
}

// --- IPC 监听器 (确保只初始化一次) ---
function initializeListeners() {
    if (listenersInitialized) {
        return; // Already initialized
    }
    window.electronAPI.onServerLog((message) => {
        const isError = /错误|失败|error|fail/i.test(message.toString());
        addServerLog(message, isError ? 'error' : 'info');
    });

    window.electronAPI.onServerStatusUpdate((status) => {
        // 保存状态到全局变量，供其他函数使用
        window.serverStatus = status;
        
        updateUIState(status.isRunning, status.port, status.clientConnected);
        
        // 当服务器状态变为运行时，尝试获取机器人信息
        if (status.isRunning && status.clientConnected) {
            // 延迟一点获取机器人信息，确保连接已经稳定
            setTimeout(() => {
                fetchBotStatus();
            }, 2000);
        }
        
        // 更新插件状态
        updatePluginStatus();
    });

    window.electronAPI.onWsMessage((message) => {
        addEventLog(message); 
        
        // 检查是否是登录相关事件
        if (message.post_type === 'meta_event' && message.meta_event_type === 'lifecycle') {
            // 机器人连接/断开事件
            const isConnected = message.sub_type === 'connect' || message.sub_type === 'enable';
            if (isConnected) {
                // 连接成功，尝试获取机器人信息
                setTimeout(() => {
                    fetchBotStatus();
                }, 1000);
            }
        }
        
        // 检查是否是API响应
        if (message.echo && message.echo.startsWith('api_get_group_list')) {
            console.log('收到群列表API响应:', message);
            
            // 检查响应是否成功
            if (message.status === 'ok' && message.retcode === 0 && Array.isArray(message.data)) {
                // 处理群列表数据
                processGroupList(message.data);
            } else {
                addServerLog(`获取群列表失败: ${message.message || '未知错误'}`, 'error');
            }
        }
    });
    listenersInitialized = true;
}

// --- UI状态更新 ---
function updateUIState(isRunning, port, clientConnected) {
    try {
        startBtn.disabled = isRunning;
        stopBtn.disabled = !isRunning;
        restartBtn.disabled = !isRunning; // 更新重启按钮状态
        listenPortInput.disabled = isRunning;
        accessTokenInput.disabled = isRunning;
        
        // 更新状态栏
        if (statusBar) {
            if (isRunning) {
                statusBar.textContent = `服务器正在运行，监听端口: ${port}`;
                statusBar.className = 'status-bar running';
            } else {
                statusBar.textContent = '服务器未运行';
                statusBar.className = 'status-bar stopped';
                
                // 重置机器人状态信息
                if (botAccountId) botAccountId.textContent = '暂无数据';
                if (botNickname) botNickname.textContent = '暂无数据';
                if (botLoginStatus) {
                    botLoginStatus.textContent = '未登录';
                    botLoginStatus.style.color = '#721c24';
                }
                if (deviceType) deviceType.textContent = '暂无数据';
                if (deviceOnlineStatus) {
                    deviceOnlineStatus.textContent = '离线';
                    deviceOnlineStatus.style.color = '#721c24';
                }
                if (protocolVersion) protocolVersion.textContent = '暂无数据';
            }
            
            // 添加客户端状态
            if (clientStatusSpan) {
                if (clientConnected) {
                    clientStatusSpan.textContent = '客户端已连接';
                    clientStatusSpan.className = 'client-connected';
                } else {
                    clientStatusSpan.textContent = '客户端未连接';
                    clientStatusSpan.className = 'client-disconnected';
                }
            }
        }
    } catch (error) {
        console.error('更新UI状态失败:', error);
    }
}

// 事件处理 - 添加机器人状态刷新按钮事件处理
startBtn.addEventListener('click', function() {
    try {
        // 获取当前配置
        const config = getConfig();
        if (!config) {
            addServerLog('无法获取配置，启动失败', 'error');
            return;
        }
        
        // 保存配置
        window.electronAPI.saveConfig(config);
        
        // 启动服务器
        addServerLog(`正在启动服务器，端口: ${config.port}...`);
        window.electronAPI.startServer(config);
    } catch (error) {
        console.error('启动服务器失败:', error);
        addServerLog(`启动服务器失败: ${error.message}`, 'error');
    }
});

stopBtn.addEventListener('click', () => {
    try {
        addServerLog('尝试停止服务器...');
        window.electronAPI.stopServer();
    } catch (error) {
        console.error('停止服务器失败:', error);
        addServerLog(`停止服务器失败: ${error.message}`, 'error');
    }
});

// 添加重启服务器按钮的事件监听器
restartBtn.addEventListener('click', async () => {
    try {
        addServerLog('尝试重启服务器...');
        
        // 先获取当前配置
        const config = getConfig();
        if (!config) {
            addServerLog('无法获取配置，重启失败', 'error');
            return;
        }
        
        // 保存配置
        await window.electronAPI.saveConfig(config);
        
        // 先停止服务器
        await window.electronAPI.stopServer();
        
        // 短暂延迟后重新启动服务器
        setTimeout(() => {
            addServerLog(`正在重新启动服务器，端口: ${config.port}...`);
            window.electronAPI.startServer(config);
        }, 1000);
    } catch (error) {
        console.error('重启服务器失败:', error);
        addServerLog(`重启服务器失败: ${error.message}`, 'error');
    }
});

// 添加监听器，当复选框状态改变时保存配置
showHeartbeatCheckbox.addEventListener('change', function() {
    showHeartbeatState = showHeartbeatCheckbox.checked;
    // 自动保存配置
    saveConfig();
});

// 添加监听器，当端口输入框变化时保存配置
listenPortInput.addEventListener('change', function() {
    saveConfig();
});

// 添加监听器，当token输入框变化时保存配置
accessTokenInput.addEventListener('change', function() {
    saveConfig();
});

// 同样添加blur事件监听器，确保用户点击其他地方时也会保存
listenPortInput.addEventListener('blur', function() {
    saveConfig();
});

accessTokenInput.addEventListener('blur', function() {
    saveConfig();
});

// 刷新机器人状态按钮点击事件
if (refreshBotStatusBtn) {
    refreshBotStatusBtn.addEventListener('click', async () => {
        // 添加视觉反馈
        const originalText = refreshBotStatusBtn.textContent;
        refreshBotStatusBtn.textContent = '正在刷新...';
        refreshBotStatusBtn.disabled = true;
        
        addServerLog('正在刷新机器人状态...');
        
        try {
            await fetchBotStatus();
        } catch (error) {
            addServerLog(`刷新状态失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            refreshBotStatusBtn.textContent = originalText;
            refreshBotStatusBtn.disabled = false;
        }
    });
}

// --- 群聊管理功能 ---
async function loadGroupConfig() {
    try {
        groupConfig = await window.electronAPI.getGroupConfig();
        renderGroupList();
        
        // 只有当编辑器容器可见时才更新编辑器内容
        if (groupJsonEditor && groupJsonEditorContainer && 
            groupJsonEditorContainer.style.display !== 'none') {
            const formattedJson = JSON.stringify(groupConfig, null, 2);
            groupJsonEditor.value = formattedJson;
            if (groupJsonStatus) {
                groupJsonStatus.textContent = '配置已加载';
                groupJsonStatus.style.color = 'var(--success-color)';
            }
        }
    } catch (error) {
        console.error('加载群组配置失败:', error);
    }
}

// 渲染群组列表
function renderGroupList() {
    // 清空现有群列表
    groupTableBody.innerHTML = '';
    
    // 获取所有群并排序（按群号）
    const groups = Object.values(groupConfig.groups)
        .sort((a, b) => a.id - b.id);
    
    if (groups.length === 0) {
        // 显示无数据提示
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px;">暂无群聊数据</td>';
        groupTableBody.appendChild(row);
        return;
    }
    
    // 为每个群创建一行
    groups.forEach(group => {
        const row = document.createElement('tr');
        row.setAttribute('data-group-id', group.id);
        
        // 选择框
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'group-checkbox';
        checkbox.setAttribute('data-group-id', group.id);
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        
        // 群号
        const idCell = document.createElement('td');
        idCell.textContent = group.id;
        row.appendChild(idCell);
        
        // 群名称
        const nameCell = document.createElement('td');
        nameCell.textContent = group.name || `群 ${group.id}`;
        row.appendChild(nameCell);
        
        // 状态
        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `group-status ${group.enabled ? 'status-enabled' : 'status-disabled'}`;
        statusSpan.textContent = group.enabled ? '已启用' : '已禁用';
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);
        
        // 操作
        const actionCell = document.createElement('td');
        
        // 启用/禁用按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `action-btn toggle-btn ${group.enabled ? '' : 'disabled'}`;
        toggleBtn.textContent = group.enabled ? '禁用' : '启用';
        toggleBtn.onclick = () => toggleGroupStatus(group.id, !group.enabled);
        actionCell.appendChild(toggleBtn);
        
        // 编辑按钮
        // const editBtn = document.createElement('button');
        // editBtn.className = 'action-btn edit-btn';
        // editBtn.textContent = '编辑';
        // editBtn.style.marginLeft = '8px';
        // editBtn.onclick = () => editGroup(group.id);
        // actionCell.appendChild(editBtn);
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.style.marginLeft = '8px';
        deleteBtn.onclick = () => deleteGroup(group.id);
        actionCell.appendChild(deleteBtn);
        
        row.appendChild(actionCell);
        
        // 添加到表格
        groupTableBody.appendChild(row);
    });
}

function deleteGroup(groupId) {
    // 确认删除
    if (!confirm(`确定要删除群 ${groupId} 吗？此操作不可恢复。`)) {
        return;
    }
    
    // 从配置中移除群组
    if (groupConfig.groups[groupId]) {
        delete groupConfig.groups[groupId];
        
        // 保存配置并更新UI
        window.electronAPI.saveGroupConfig(groupConfig);
        renderGroupList();
        
        addServerLog(`已删除群 ${groupId}`, 'info');
    } else {
        addServerLog(`群 ${groupId} 不存在`, 'error');
    }
}

function addGroup() {
    const groupId = groupIdInput.value.trim();
    
    // 验证群号
    if (!groupId || isNaN(parseInt(groupId))) {
        alert('请输入有效的群号');
        return;
    }
    
    // 检查是否已存在
    if (groupConfig.groups[groupId]) {
        alert(`群 ${groupId} 已存在`);
        return;
    }
    
    // 创建新群配置
    const newGroup = {
        id: groupId,
        name: `群 ${groupId}`,
        enabled: false // 默认禁用
    };
    
    // 添加到配置并保存
    groupConfig.groups[groupId] = newGroup;
    window.electronAPI.saveGroupConfig(groupConfig);
    
    // 更新UI
    renderGroupList();
    groupIdInput.value = ''; // 清空输入框
    
    addServerLog(`已添加群聊: ${groupId} [已禁用]`, 'info');
}

function editGroup(groupId) {
    const group = groupConfig.groups[groupId];
    if (!group) {
        alert('未找到该群');
        return;
    }
    
    // 简单的编辑对话框
    const newName = prompt('请输入群名称', group.name);
    if (newName === null) return; // 用户取消
    
    // 更新群信息
    group.name = newName;
    window.electronAPI.updateGroupInfo(group);
    
    // 更新UI
    renderGroupList();
    addServerLog(`已更新群 ${groupId} 的信息`, 'info');
}

function toggleGroupStatus(groupId, enabled) {
    window.electronAPI.toggleGroupStatus({ groupId, enabled });
    addServerLog(`已${enabled ? '启用' : '禁用'}群 ${groupId}`, 'info');
}

// 事件监听
addGroupBtn.addEventListener('click', addGroup);

refreshGroupsBtn.addEventListener('click', () => {
    loadGroupConfig();
    addServerLog('已刷新群列表', 'info');
});

// 获取QQ机器人的群聊列表
getGroupListBtn.addEventListener('click', async () => {
    await fetchGroupList();
});

// 调用onebot API获取群聊列表并添加到配置中
async function fetchGroupList() {
    try {
        addServerLog('正在获取机器人群聊列表...', 'info');
        
        const serverStatus = window.serverStatus;
        if (!serverStatus || !serverStatus.isRunning) {
            addServerLog('服务器未运行，无法获取群聊列表', 'error');
            return;
        }
        
        // 获取API对象
        const api = getApi();
        if (!api) {
            addServerLog('API对象未初始化，无法获取群列表', 'error');
            return;
        }
        
        // 使用完整的API模块
        let response;
        try {
            // 使用group.getGroupList方法获取群列表
            response = await api.group.getGroupList();
            console.log('获取群列表，响应:', response);
        } catch (error) {
            console.error('API调用失败:', error);
            addServerLog(`API调用失败: ${error.message}`, 'error');
            return;
        }
        
        if (!response || response.status === 'failed') {
            addServerLog(`获取群聊列表失败: ${response?.message || '未知错误'}`, 'error');
            return;
        }
        
        // 直接处理API响应的数据
        if (response.data && Array.isArray(response.data)) {
            addServerLog(`直接处理API响应数据，共 ${response.data.length} 个群`, 'info');
            processGroupList(response.data);
        } else {
            addServerLog('API响应数据格式不正确', 'error');
            console.error('API响应数据格式不正确:', response);
        }
    } catch (error) {
        console.error('获取群列表出错:', error);
        addServerLog(`获取群列表出错: ${error.message}`, 'error');
    }
}

// 处理onebot返回的群聊列表，将其添加到配置中
function processGroupList(groups) {
    try {
        if (!Array.isArray(groups)) {
            addServerLog('收到的群聊数据格式错误', 'error');
            return;
        }
        
        addServerLog(`收到群列表数据，共 ${groups.length} 个群`, 'info');
        console.log('处理群列表数据:', groups);
        
        let addedCount = 0;
        
        groups.forEach(group => {
            const groupId = group.group_id.toString();
            
            // 检查群是否已存在
            if (groupConfig.groups[groupId]) {
                // 更新已存在的群信息，但不改变其启用状态
                groupConfig.groups[groupId].name = group.group_name || `群 ${groupId}`;
                addServerLog(`更新群信息: ${groupId} (${group.group_name})`, 'info');
            } else {
                // 添加新群，默认禁用
                groupConfig.groups[groupId] = {
                    id: groupId,
                    name: group.group_name || `群 ${groupId}`,
                    enabled: false
                };
                addedCount++;
                addServerLog(`添加新群: ${groupId} (${group.group_name}) [已禁用]`, 'info');
            }
        });
        
        // 保存配置并更新UI
        window.electronAPI.saveGroupConfig(groupConfig);
        renderGroupList();
        
        addServerLog(`群聊列表同步完成，新增 ${addedCount} 个群`, 'info');
    } catch (error) {
        console.error('处理群列表出错:', error);
        addServerLog(`处理群列表出错: ${error.message}`, 'error');
    }
}

// 监听群状态更新
window.electronAPI.onGroupStatusUpdated((data) => {
    // 确保配置中有该群
    if (groupConfig.groups[data.groupId]) {
        groupConfig.groups[data.groupId].enabled = data.enabled;
        renderGroupList();
    }
});

// 监听群信息更新
window.electronAPI.onGroupInfoUpdated((groupInfo) => {
    if (groupConfig.groups[groupInfo.id]) {
        Object.assign(groupConfig.groups[groupInfo.id], groupInfo);
        renderGroupList();
    }
});

// 全部启用群聊
function enableAllGroups() {
    if (!groupConfig || !groupConfig.groups) return;
    
    const groupIds = Object.keys(groupConfig.groups);
    if (groupIds.length === 0) {
        addServerLog('没有可启用的群聊', 'info');
        return;
    }
    
    // 修改所有群聊的启用状态
    let count = 0;
    groupIds.forEach(groupId => {
        if (!groupConfig.groups[groupId].enabled) {
            groupConfig.groups[groupId].enabled = true;
            count++;
        }
    });
    
    // 保存配置并更新UI
    window.electronAPI.saveGroupConfig(groupConfig);
    renderGroupList();
    
    addServerLog(`已启用全部群聊，共 ${count} 个群被修改`, 'info');
}

// 全部禁用群聊
function disableAllGroups() {
    if (!groupConfig || !groupConfig.groups) return;
    
    const groupIds = Object.keys(groupConfig.groups);
    if (groupIds.length === 0) {
        addServerLog('没有可禁用的群聊', 'info');
        return;
    }
    
    // 修改所有群聊的启用状态
    let count = 0;
    groupIds.forEach(groupId => {
        if (groupConfig.groups[groupId].enabled) {
            groupConfig.groups[groupId].enabled = false;
            count++;
        }
    });
    
    // 保存配置并更新UI
    window.electronAPI.saveGroupConfig(groupConfig);
    renderGroupList();
    
    addServerLog(`已禁用全部群聊，共 ${count} 个群被修改`, 'info');
}

// 初始化群聊管理页面
function initGroupManagementPage() {
    // ... existing code ...
    
    // 添加全部启用/禁用按钮事件
    const enableAllGroupsBtn = document.getElementById('enableAllGroupsBtn');
    const disableAllGroupsBtn = document.getElementById('disableAllGroupsBtn');
    
    enableAllGroupsBtn.addEventListener('click', enableAllGroups);
    disableAllGroupsBtn.addEventListener('click', disableAllGroups);
    
    // ... existing code ...
}

// 页面切换功能
function initializePageSwitcher() {
    // 获取所有导航项和页面容器
    const navItems = document.querySelectorAll('.nav-item');
    const pageContainers = document.querySelectorAll('.page-container');
    
    // 点击导航项时切换页面
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有导航项的active类
            navItems.forEach(i => i.classList.remove('active'));
            // 添加当前导航项的active类
            this.classList.add('active');
            
            // 获取要显示的页面ID
            const targetPageId = this.getAttribute('data-page');
            
            // 隐藏所有页面
            pageContainers.forEach(container => {
                container.classList.remove('active');
            });
            
            // 显示目标页面
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // 如果切换到插件管理页面，更新插件状态
                if (targetPageId === 'plugin-management-page') {
                    console.log('切换到插件管理页面，触发插件状态更新');
                    updatePluginStatus();
                }
            } else {
                console.error(`找不到页面: ${targetPageId}`);
            }
        });
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 初始化服务器状态对象
    window.serverStatus = {
        isRunning: false,
        port: null,
        clientConnected: false
    };
    
    // 加载配置
    loadConfig().catch(error => {
        console.error('加载配置失败:', error);
    });
    
    // 初始化页面切换功能
    initializePageSwitcher();
    
    // 初始化其他监听器
    initializeListeners();
    
    // 初始化API相关功能
    initApi().catch(error => {
        console.error('初始化API相关功能失败:', error);
    });
    
    // 初始显示插件状态
    setTimeout(() => {
        updatePluginStatus();
    }, 500);
});

// 更新插件状态
async function updatePluginStatus() {
    try {
        const pluginStatusBar = document.getElementById('plugin-status-bar');
        const pluginStatus = document.getElementById('plugin-status');
        const pluginGroupsContainer = document.getElementById('pluginGroupsContainer');
        
        console.log('开始更新插件状态，当前服务器状态:', window.serverStatus);
        
        if (!pluginStatusBar || !pluginStatus || !pluginGroupsContainer) {
            console.error('找不到插件状态相关DOM元素');
            return;
        }
        
        // 检查服务器状态
        const serverStatus = window.serverStatus;
        const isRunning = serverStatus && serverStatus.isRunning;
        
        console.log(`服务器运行状态: ${isRunning}`);
        
        if (isRunning) {
            pluginStatusBar.className = 'status-bar running';
            pluginStatus.textContent = '服务器已启动，插件系统已激活';
            
            // 获取插件列表
            try {
                console.log('尝试获取插件列表...');
                const result = await window.electronAPI.getPlugins();
                console.log('获取插件列表结果:', result);
                
                if (result.error) {
                    console.error('获取插件列表出错:', result.error);
                    pluginGroupsContainer.innerHTML = `<div class="plugin-empty">${result.error}</div>`;
                    return;
                }
                
                if (!result.plugins || result.plugins.length === 0) {
                    console.log('没有找到已加载的插件');
                    pluginGroupsContainer.innerHTML = '<div class="plugin-empty">没有找到已加载的插件</div>';
                    return;
                }
                
                console.log(`找到 ${result.plugins.length} 个插件:`, result.plugins);
                
                // 按照目录分组插件
                const groupedPlugins = {};
                
                result.plugins.forEach(plugin => {
                    // 从路径中提取分组名称
                    const group = plugin.group || '默认';
                    
                    if (!groupedPlugins[group]) {
                        groupedPlugins[group] = [];
                    }
                    
                    groupedPlugins[group].push(plugin);
                });
                
                console.log('插件分组结果:', groupedPlugins);
                
                // 清空加载提示
                pluginGroupsContainer.innerHTML = '';
                
                // 按分组渲染插件
                Object.keys(groupedPlugins).forEach(group => {
                    const plugins = groupedPlugins[group];
                    const groupElement = document.createElement('div');
                    groupElement.className = 'plugin-group';
                    
                    groupElement.innerHTML = `
                        <div class="plugin-group-header">
                            <h4 class="plugin-group-name">
                                ${group} 
                                <span class="plugin-group-badge">${plugins.length}</span>
                            </h4>
                        </div>
                        <div class="plugin-list">
                            ${plugins.map(plugin => `
                                <div class="plugin-card">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <h5 class="plugin-name">${plugin.name}</h5>
                                        <span class="plugin-status plugin-status-${plugin.status.toLowerCase()}">${plugin.status}</span>
                                    </div>
                                    <p class="plugin-description">${plugin.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    pluginGroupsContainer.appendChild(groupElement);
                });
                
                console.log('完成插件渲染');
                
            } catch (error) {
                console.error('获取插件列表失败:', error);
                pluginGroupsContainer.innerHTML = `<div class="plugin-empty">加载插件时出错: ${error.message}</div>`;
            }
        } else {
            console.log('服务器未运行，不加载插件');
            pluginStatusBar.className = 'status-bar stopped';
            pluginStatus.textContent = '服务器未运行，无法使用插件功能';
            pluginGroupsContainer.innerHTML = '<div class="plugin-empty">请先启动服务器来查看已加载的插件</div>';
        }
    } catch (error) {
        console.error('更新插件状态出错:', error);
    }
}

// 存储插件商店数据
let storePlugins = [];

// 显示插件商店
function showPluginStore() {
    // 显示插件商店容器，隐藏插件列表容器
    const pluginGroupsContainer = document.getElementById('pluginGroupsContainer');
    if (pluginGroupsContainer) {
        pluginGroupsContainer.parentElement.style.display = 'none';
    }
    
    if (pluginStoreContainer) {
        pluginStoreContainer.style.display = 'block';
    }
    
    // 首次显示时加载插件商店数据
    if (storePlugins.length === 0) {
        fetchPluginStore();
    }
}

// 隐藏插件商店
function hidePluginStore() {
    // 隐藏插件商店容器，显示插件列表容器
    const pluginGroupsContainer = document.getElementById('pluginGroupsContainer');
    if (pluginGroupsContainer) {
        pluginGroupsContainer.parentElement.style.display = 'block';
    }
    
    if (pluginStoreContainer) {
        pluginStoreContainer.style.display = 'none';
    }
}

// 获取插件商店数据
async function fetchPluginStore() {
    if (!storeStatus) return;
    
    try {
        storeStatus.innerHTML = '<div class="loading-spinner"></div> 正在获取插件商店数据...';
        storeStatus.className = 'status-bar running';
        
        if (storePluginsContainer) {
            storePluginsContainer.innerHTML = '<div class="plugin-loading">正在加载插件商店数据...</div>';
        }
        
        const response = await window.electronAPI.getPluginStore();
        
        if (response.success && response.plugins) {
            storePlugins = response.plugins;
            storeStatus.textContent = `插件商店共有 ${response.count} 个插件，获取时间: ${new Date().toLocaleString()}`;
            storeStatus.className = 'status-bar running';
            renderPluginStore(storePlugins);
        } else {
            storeStatus.textContent = `获取插件商店数据失败: ${response.error || '未知错误'}`;
            storeStatus.className = 'status-bar stopped';
            
            if (storePluginsContainer) {
                storePluginsContainer.innerHTML = `<div class="plugin-empty">获取插件数据失败: ${response.error || '未知错误'}</div>`;
            }
        }
    } catch (error) {
        console.error('获取插件商店数据出错:', error);
        storeStatus.textContent = `获取插件商店数据出错: ${error.message}`;
        storeStatus.className = 'status-bar stopped';
        
        if (storePluginsContainer) {
            storePluginsContainer.innerHTML = `<div class="plugin-empty">获取插件数据出错: ${error.message}</div>`;
        }
    }
}

// 渲染插件商店列表
async function renderPluginStore(plugins) {
    if (!storePluginsContainer) return;
    
    // 显示当前代理设置
    const proxyInfo = document.createElement('div');
    proxyInfo.className = 'proxy-info';
    proxyInfo.style.marginBottom = '15px';
    proxyInfo.style.fontSize = '0.9em';
    proxyInfo.style.color = 'var(--text-light)';
    
    // 由于无法在渲染进程中直接访问process.env，我们需要获取代理信息
    try {
        // 假设代理信息来自后端，这里先简化处理
        const httpProxy = null; // 修改为从主进程获取
        
        if (httpProxy) {
            proxyInfo.innerHTML = `
                <span style="color: var(--success-color);">✓</span> 
                当前使用代理: <code>${httpProxy}</code>
            `;
        } else {
            proxyInfo.innerHTML = `
                <span style="color: var(--warning-color);">⚠</span> 
                未检测到HTTP代理设置。如果无法下载插件，请考虑设置代理。
                <button id="setupProxyBtn" class="action-btn" style="padding: 2px 8px; font-size: 0.9em; margin-left: 10px;">设置代理</button>
            `;
        }
    } catch (error) {
        console.error("获取代理信息失败:", error);
        proxyInfo.innerHTML = `
            <span style="color: var(--warning-color);">⚠</span> 
            无法获取代理设置。如果无法下载插件，请考虑设置代理。
            <button id="setupProxyBtn" class="action-btn" style="padding: 2px 8px; font-size: 0.9em; margin-left: 10px;">设置代理</button>
        `;
    }
    
    // 清空容器但保留代理信息
    storePluginsContainer.innerHTML = '';
    storePluginsContainer.appendChild(proxyInfo);
    
    // 绑定设置代理按钮事件
    const setupProxyBtn = document.getElementById('setupProxyBtn');
    if (setupProxyBtn) {
        setupProxyBtn.addEventListener('click', setupProxy);
    }
    
    // 确保插件数据存在
    if (!plugins || !Array.isArray(plugins) || plugins.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'plugin-empty';
        emptyMessage.textContent = '没有找到任何插件';
        storePluginsContainer.appendChild(emptyMessage);
        return;
    }
    
    console.log("开始渲染插件列表，共有插件:", plugins.length);
    
    // 应用搜索和过滤
    const searchTerm = pluginSearchInput ? pluginSearchInput.value.trim().toLowerCase() : '';
    const typeFilter = pluginTypeFilter ? pluginTypeFilter.value : 'all';
    
    // 过滤插件
    const filteredPlugins = plugins.filter(plugin => {
        // 名称和描述搜索
        const matchesSearch = 
            !searchTerm || 
            plugin.name.toLowerCase().includes(searchTerm) || 
            plugin.description.toLowerCase().includes(searchTerm);
        
        // 类型过滤
        const matchesType = typeFilter === 'all' || plugin.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    console.log("过滤后的插件数量:", filteredPlugins.length);
    
    if (filteredPlugins.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'plugin-empty';
        emptyMessage.textContent = '没有找到符合条件的插件';
        storePluginsContainer.appendChild(emptyMessage);
        return;
    }
    
    // 渲染每个插件
    for (const plugin of filteredPlugins) {
        try {
            // 检查插件是否已安装
            const installStatus = await window.electronAPI.checkPluginInstalled(plugin);
            
            const pluginElement = document.createElement('div');
            pluginElement.className = 'plugin-store-item';
            pluginElement.setAttribute('data-plugin-name', plugin.name);
            pluginElement.setAttribute('data-plugin-type', plugin.type);
            
            // 创建插件信息部分
            const infoElement = document.createElement('div');
            infoElement.className = 'plugin-store-info';
            
            // 插件名称和类型标签
            infoElement.innerHTML = `
                <h4 class="plugin-store-name">
                    ${plugin.name}
                    <span class="plugin-type-badge">${plugin.type}</span>
                </h4>
                <p class="plugin-store-description">${plugin.description}</p>
                <div class="plugin-store-meta">
                    <span>
                        <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                        ${plugin.files ? plugin.files.length : 0}个文件
                    </span>
                </div>
            `;
            
            // 创建操作按钮部分
            const actionsElement = document.createElement('div');
            actionsElement.className = 'plugin-store-actions';
            
            if (installStatus.installed) {
                // 已安装标签
                const installedBadge = document.createElement('span');
                installedBadge.className = 'installed-badge';
                installedBadge.textContent = '已安装';
                actionsElement.appendChild(installedBadge);
                
                // 重新安装按钮
                const reinstallBtn = document.createElement('button');
                reinstallBtn.className = 'action-btn edit-btn';
                reinstallBtn.textContent = '重新安装';
                reinstallBtn.addEventListener('click', () => installPluginFromStore(plugin));
                actionsElement.appendChild(reinstallBtn);
            } else {
                // 安装按钮
                const installBtn = document.createElement('button');
                installBtn.className = 'action-btn install-btn';
                installBtn.textContent = '安装';
                installBtn.addEventListener('click', () => installPluginFromStore(plugin));
                actionsElement.appendChild(installBtn);
            }
            
            // 组合插件元素
            pluginElement.appendChild(infoElement);
            pluginElement.appendChild(actionsElement);
            
            // 添加到容器
            storePluginsContainer.appendChild(pluginElement);
        } catch (error) {
            console.error(`渲染插件 ${plugin.name} 时出错:`, error);
        }
    }
}

// 安装插件
async function installPluginFromStore(plugin) {
    try {
        // 更新插件元素状态
        const pluginElement = storePluginsContainer.querySelector(`[data-plugin-name="${plugin.name}"][data-plugin-type="${plugin.type}"]`);
        if (pluginElement) {
            const actionsElement = pluginElement.querySelector('.plugin-store-actions');
            if (actionsElement) {
                actionsElement.innerHTML = '<div class="loading-spinner"></div> <span style="margin-left: 8px;">正在安装...</span>';
            }
        }
        
        // 安装插件
        const result = await window.electronAPI.installPlugin(plugin);
        
        // 更新UI显示安装结果
        if (pluginElement) {
            const actionsElement = pluginElement.querySelector('.plugin-store-actions');
            if (actionsElement) {
                if (result.success) {
                    // 安装成功
                    actionsElement.innerHTML = `
                        <span class="installed-badge">已安装</span>
                        <button class="action-btn edit-btn">重新安装</button>
                    `;
                    // 重新绑定按钮事件
                    const reinstallBtn = actionsElement.querySelector('.action-btn');
                    if (reinstallBtn) {
                        reinstallBtn.addEventListener('click', () => installPluginFromStore(plugin));
                    }
                    
                    addServerLog(`插件 ${plugin.name} 安装成功！`, 'info');
                } else {
                    // 安装失败
                    let failMessage = '安装失败';
                    if (result.results) {
                        // 检查部分成功的情况
                        const successCount = result.results.filter(r => r.success).length;
                        const totalCount = result.results.length;
                        if (successCount > 0) {
                            failMessage = `部分成功 (${successCount}/${totalCount})`;
                        }
                    }
                    
                    actionsElement.innerHTML = `
                        <span style="color: var(--danger-color);">${failMessage}</span>
                        <button class="action-btn install-btn">重试</button>
                    `;
                    
                    // 重新绑定按钮事件
                    const retryBtn = actionsElement.querySelector('.action-btn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', () => installPluginFromStore(plugin));
                    }
                    
                    addServerLog(`插件 ${plugin.name} 安装失败: ${result.error || '未知错误'}`, 'error');
                }
            }
        }
        
        // 记录安装结果
        if (result.success) {
            console.log(`插件 ${plugin.name} 安装成功:`, result);
        } else {
            console.error(`插件 ${plugin.name} 安装失败:`, result);
        }
    } catch (error) {
        console.error(`安装插件 ${plugin.name} 出错:`, error);
        addServerLog(`安装插件 ${plugin.name} 出错: ${error.message}`, 'error');
        
        // 更新UI显示错误
        const pluginElement = storePluginsContainer.querySelector(`[data-plugin-name="${plugin.name}"][data-plugin-type="${plugin.type}"]`);
        if (pluginElement) {
            const actionsElement = pluginElement.querySelector('.plugin-store-actions');
            if (actionsElement) {
                actionsElement.innerHTML = `
                    <span style="color: var(--danger-color);">安装出错</span>
                    <button class="action-btn install-btn">重试</button>
                `;
                
                // 重新绑定按钮事件
                const retryBtn = actionsElement.querySelector('.action-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => installPluginFromStore(plugin));
                }
            }
        }
    }
}

// 初始化插件商店
function initPluginStore() {
    // 打开插件商店按钮
    if (openPluginStoreBtn) {
        openPluginStoreBtn.addEventListener('click', showPluginStore);
    }
    
    // 关闭插件商店按钮
    if (closePluginStoreBtn) {
        closePluginStoreBtn.addEventListener('click', hidePluginStore);
    }
    
    // 搜索输入框
    if (pluginSearchInput) {
        pluginSearchInput.addEventListener('input', () => {
            renderPluginStore(storePlugins);
        });
    }
    
    // 类型过滤下拉框
    if (pluginTypeFilter) {
        pluginTypeFilter.addEventListener('change', () => {
            renderPluginStore(storePlugins);
        });
    }
    
    // 刷新按钮
    if (refreshStoreBtn) {
        refreshStoreBtn.addEventListener('click', fetchPluginStore);
    }
}

// 初始化API相关功能
async function initApi() {
    // 加载群组配置
    await loadGroupConfig();
    
    // 获取群聊列表按钮绑定事件
    getGroupListBtn.addEventListener('click', fetchGroupList);
    
    // 绑定添加群聊按钮事件
    addGroupBtn.addEventListener('click', addGroup);
    
    // 刷新群列表按钮事件
    refreshGroupsBtn.addEventListener('click', () => {
        loadGroupConfig();
        addServerLog('已刷新群列表', 'info');
    });
    
    // 添加全部启用/禁用按钮事件
    const enableAllGroupsBtn = document.getElementById('enableAllGroupsBtn');
    const disableAllGroupsBtn = document.getElementById('disableAllGroupsBtn');
    
    if (enableAllGroupsBtn) {
        enableAllGroupsBtn.addEventListener('click', enableAllGroups);
    }
    
    if (disableAllGroupsBtn) {
        disableAllGroupsBtn.addEventListener('click', disableAllGroups);
    }
    
    // 添加group.json编辑器的事件监听
    if (editGroupJsonBtn) {
        editGroupJsonBtn.addEventListener('click', showGroupJsonEditor);
    }
    
    if (cancelEditJsonBtn) {
        cancelEditJsonBtn.addEventListener('click', hideGroupJsonEditor);
    }
    
    if (loadGroupJsonBtn) {
        loadGroupJsonBtn.addEventListener('click', loadGroupJsonToEditor);
    }
    
    if (saveGroupJsonBtn) {
        saveGroupJsonBtn.addEventListener('click', saveGroupJsonFromEditor);
    }
    
    // 初始化插件商店
    initPluginStore();
}

// 直接加载group.json到编辑器
async function loadGroupJsonToEditor() {
    try {
        groupJsonStatus.textContent = '正在加载配置...';
        groupJsonStatus.style.color = 'var(--text-light)';
        
        // 从主进程获取群组配置
        const config = await window.electronAPI.getGroupConfig();
        
        // 格式化成美观的JSON并显示在编辑器中
        const formattedJson = JSON.stringify(config, null, 2);
        groupJsonEditor.value = formattedJson;
        
        groupJsonStatus.textContent = '配置已加载';
        groupJsonStatus.style.color = 'var(--success-color)';
    } catch (error) {
        console.error('加载群组配置失败:', error);
        groupJsonStatus.textContent = `加载失败: ${error.message}`;
        groupJsonStatus.style.color = 'var(--danger-color)';
    }
}

// 保存编辑器中的内容到group.json
async function saveGroupJsonFromEditor() {
    try {
        const jsonContent = groupJsonEditor.value.trim();
        if (!jsonContent) {
            groupJsonStatus.textContent = '配置内容不能为空';
            groupJsonStatus.style.color = 'var(--danger-color)';
            return;
        }
        
        // 尝试解析JSON以验证格式是否正确
        let parsedConfig;
        try {
            parsedConfig = JSON.parse(jsonContent);
        } catch (parseError) {
            groupJsonStatus.textContent = `JSON格式错误: ${parseError.message}`;
            groupJsonStatus.style.color = 'var(--danger-color)';
            return;
        }
        
        // 确保groups属性存在
        if (!parsedConfig.groups) {
            parsedConfig.groups = {};
        }
        
        // 保存配置
        await window.electronAPI.saveGroupConfig(parsedConfig);
        
        // 更新全局配置变量
        groupConfig = parsedConfig;
        
        // 更新UI
        renderGroupList();
        
        groupJsonStatus.textContent = '配置已保存';
        groupJsonStatus.style.color = 'var(--success-color)';
        
        addServerLog('群组配置已通过编辑器保存', 'info');
        
        // 保存成功后自动隐藏编辑器
        setTimeout(() => {
            hideGroupJsonEditor();
        }, 1000); // 延迟1秒，让用户看到成功消息
    } catch (error) {
        console.error('保存群组配置失败:', error);
        groupJsonStatus.textContent = `保存失败: ${error.message}`;
        groupJsonStatus.style.color = 'var(--danger-color)';
    }
}

// 显示编辑器
function showGroupJsonEditor() {
    // 加载最新配置到编辑器
    loadGroupJsonToEditor().then(() => {
        // 显示编辑器容器
        if (groupJsonEditorContainer) {
            groupJsonEditorContainer.style.display = 'block';
        }
        // 隐藏编辑按钮
        if (editGroupJsonBtn) {
            editGroupJsonBtn.style.display = 'none';
        }
    }).catch(error => {
        addServerLog(`加载配置失败: ${error.message}`, 'error');
    });
}

// 隐藏编辑器
function hideGroupJsonEditor() {
    if (groupJsonEditorContainer) {
        groupJsonEditorContainer.style.display = 'none';
    }
    if (editGroupJsonBtn) {
        editGroupJsonBtn.style.display = 'inline-block';
    }
}

// 设置HTTP代理
function setupProxy() {
    // 显示代理设置对话框
    const currentProxy = process.env.HTTP_PROXY || process.env.http_proxy || '';
    const proxyValue = prompt('请输入HTTP代理地址 (例如: http://127.0.0.1:7890)', currentProxy);
    
    if (proxyValue === null) {
        // 用户取消设置
        return;
    }
    
    if (proxyValue.trim() === '') {
        // 清除代理设置
        process.env.HTTP_PROXY = '';
        process.env.http_proxy = '';
        addServerLog('已清除HTTP代理设置', 'info');
    } else {
        // 设置新代理
        process.env.HTTP_PROXY = proxyValue.trim();
        process.env.http_proxy = proxyValue.trim();
        addServerLog(`已设置HTTP代理: ${proxyValue.trim()}`, 'info');
    }
    
    // 刷新插件商店显示
    renderPluginStore(storePlugins);
}

// 批量删除选中的群组
function batchDeleteGroups() {
    // 获取所有选中的群组ID
    const selectedCheckboxes = document.querySelectorAll('.group-checkbox:checked');
    const selectedGroupIds = Array.from(selectedCheckboxes).map(checkbox => 
        checkbox.getAttribute('data-group-id')
    );
    
    // 检查是否有选中的群组
    if (selectedGroupIds.length === 0) {
        alert('请先选择要删除的群组');
        return;
    }
    
    // 确认删除
    if (!confirm(`确定要删除选中的 ${selectedGroupIds.length} 个群组吗？此操作不可恢复。`)) {
        return;
    }
    
    // 调用主进程删除群组
    window.electronAPI.batchDeleteGroups(selectedGroupIds);
}

// 全选/取消全选
function toggleSelectAllGroups() {
    const selectAllCheckbox = document.getElementById('selectAllGroups');
    const isChecked = selectAllCheckbox.checked;
    
    // 设置所有复选框的状态
    document.querySelectorAll('.group-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// 监听群组批量删除事件
window.electronAPI.onGroupsBatchDeleted(() => {
    // 刷新列表
    loadGroupConfig();
});

// 批量删除按钮点击事件
const batchDeleteBtn = document.getElementById('batchDeleteBtn');
if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', batchDeleteGroups);
}

// 全选/取消全选复选框
const selectAllGroups = document.getElementById('selectAllGroups');
if (selectAllGroups) {
    selectAllGroups.addEventListener('change', toggleSelectAllGroups);
}