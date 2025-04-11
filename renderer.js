// const { ipcRenderer } = require('electron'); // 不再需要直接使用ipcRenderer
// const WebSocket = require('ws'); // 不再需要ws客户端

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const listenPortInput = document.getElementById('listenPort');
const accessTokenInput = document.getElementById('accessToken');
const statusBar = document.getElementById('status-bar');
const clientStatusSpan = document.getElementById('client-status');
const serverLogContainer = document.getElementById('server-log-container');
const serverLogDisplay = document.getElementById('server-log-display'); // 新的服务器日志展示区
const eventLogContainer = document.getElementById('event-log-container');
const showHeartbeatCheckbox = document.getElementById('showHeartbeat'); // 获取复选框元素
let showHeartbeatState = true; // Add a variable to hold the state
let configLoaded = false; // Add a flag to track if config is loaded
let listenersInitialized = false; // Add flag for listener initialization

// 群聊管理元素
const groupIdInput = document.getElementById('groupIdInput');
const addGroupBtn = document.getElementById('addGroupBtn');
const refreshGroupsBtn = document.getElementById('refreshGroupsBtn');
const groupTableBody = document.getElementById('groupTableBody');
const getGroupListBtn = document.getElementById('getGroupListBtn');

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
        
        const isHeartbeat = typeof message === 'object' && message.meta_event_type === 'heartbeat';
        
        if (isHeartbeat && !showHeartbeatState) {
            console.log('[addEventLog] 心跳消息被过滤');
            return; // Skip logging
        }
        
        // 同时输出到控制台，便于调试
        console.log(`[事件日志] ${typeof message === 'object' ? JSON.stringify(message) : message}`);
        
        addLog(eventLogContainer, message, message.post_type || (message.echo ? 'api' : 'info'));
    } catch (error) {
        console.error('添加事件日志失败:', error, '原始消息:', message);
    }
}

// --- UI状态更新 (恢复被删除的代码) ---
function updateUIState(isRunning, port, clientConnected) {
    statusBar.className = `status-bar ${isRunning ? 'running' : 'stopped'}`;
    statusBar.firstChild.textContent = isRunning ? `服务运行中 (端口: ${port})` : '服务未运行';

    if (isRunning) {
        clientStatusSpan.textContent = clientConnected ? '客户端已连接' : '等待客户端连接...';
        clientStatusSpan.className = clientConnected ? 'client-connected' : 'client-disconnected';
    } else {
        clientStatusSpan.textContent = ''; // 服务停止时不显示客户端状态
    }

    startBtn.disabled = isRunning;
    stopBtn.disabled = !isRunning;
    listenPortInput.disabled = isRunning;
    accessTokenInput.disabled = isRunning;
}

// --- 事件处理 ---
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

// --- IPC 监听器 (确保只初始化一次) (恢复被删除的代码) ---
function initializeListeners() {
    if (listenersInitialized) {
        return; // Already initialized
    }
    window.electronAPI.onServerLog((message) => {
        const isError = /错误|失败|error|fail/i.test(message.toString());
        addServerLog(message, isError ? 'error' : 'info');
    });

    window.electronAPI.onServerStatusUpdate((status) => {
        updateUIState(status.isRunning, status.port, status.clientConnected);
    });

    window.electronAPI.onWsMessage((message) => {
        addEventLog(message); 
        
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
    // Remove console.log
    // console.log('IPC listeners initialized.'); 
}

// --- 群聊管理功能 ---
async function loadGroupConfig() {
    try {
        groupConfig = await window.electronAPI.getGroupConfig();
        renderGroupList();
    } catch (error) {
        console.error('加载群组配置失败:', error);
    }
}

function renderGroupList() {
    // 清空现有群列表
    groupTableBody.innerHTML = '';
    
    // 获取所有群并排序（按群号）
    const groups = Object.values(groupConfig.groups)
        .sort((a, b) => a.id - b.id);
    
    if (groups.length === 0) {
        // 显示无数据提示
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; padding: 20px;">暂无群聊数据</td>';
        groupTableBody.appendChild(row);
        return;
    }
    
    // 为每个群创建一行
    groups.forEach(group => {
        const row = document.createElement('tr');
        row.setAttribute('data-group-id', group.id);
        
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
        
        // 编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.textContent = '编辑';
        editBtn.onclick = () => editGroup(group.id);
        actionCell.appendChild(editBtn);
        
        // 启用/禁用按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `action-btn toggle-btn ${group.enabled ? '' : 'disabled'}`;
        toggleBtn.textContent = group.enabled ? '禁用' : '启用';
        toggleBtn.onclick = () => toggleGroupStatus(group.id, !group.enabled);
        actionCell.appendChild(toggleBtn);
        
        row.appendChild(actionCell);
        
        // 添加到表格
        groupTableBody.appendChild(row);
    });
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
        enabled: true
    };
    
    // 添加到配置并保存
    groupConfig.groups[groupId] = newGroup;
    window.electronAPI.saveGroupConfig(groupConfig);
    
    // 更新UI
    renderGroupList();
    groupIdInput.value = ''; // 清空输入框
    
    addServerLog(`已添加群聊: ${groupId}`, 'info');
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
                // 更新已存在的群信息
                groupConfig.groups[groupId].name = group.group_name || `群 ${groupId}`;
                addServerLog(`更新群信息: ${groupId} (${group.group_name})`, 'info');
            } else {
                // 添加新群
                groupConfig.groups[groupId] = {
                    id: groupId,
                    name: group.group_name || `群 ${groupId}`,
                    enabled: true
                };
                addedCount++;
                addServerLog(`添加新群: ${groupId} (${group.group_name})`, 'info');
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    addServerLog('DOM内容加载完成，开始初始化...', 'info');
    
    try {
        console.log('开始初始化应用...');
        
        // 初始化监听器
        initializeListeners();
        
        // 加载配置
        await loadConfig();
        
        // 加载群组配置
        await loadGroupConfig();
        
        // 初始化API
        const api = getApi();
        if (api) {
            console.log('API模块初始化成功');
        } else {
            console.warn('API模块初始化失败');
        }
        
        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
});