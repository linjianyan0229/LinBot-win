const { contextBridge, ipcRenderer } = require('electron');

// 创建一个简化版的API对象
const apiObject = {
  // 群组API
  group: {
    getGroupList: async () => await ipcRenderer.invoke('call-onebot-api', 'get_group_list', {}),
    getGroupInfo: async (group_id, no_cache = false) => 
      await ipcRenderer.invoke('call-onebot-api', 'get_group_info', { group_id, no_cache }),
    getGroupMemberInfo: async (group_id, user_id, no_cache = false) => 
      await ipcRenderer.invoke('call-onebot-api', 'get_group_member_info', { group_id, user_id, no_cache }),
    getGroupMemberList: async (group_id) => 
      await ipcRenderer.invoke('call-onebot-api', 'get_group_member_list', { group_id }),
    setGroupWholeBan: async (group_id, enable = true) =>
      await ipcRenderer.invoke('call-onebot-api', 'set_group_whole_ban', { group_id, enable })
  },
  
  // 消息API
  message: {
    sendGroupMsg: async (group_id, message) =>
      await ipcRenderer.invoke('call-onebot-api', 'send_group_msg', { group_id, message }),
    sendPrivateMsg: async (user_id, message) =>
      await ipcRenderer.invoke('call-onebot-api', 'send_private_msg', { user_id, message })
  },
  
  // 直接调用API的方法
  call: async (action, params = {}) => {
    console.log(`直接API调用: ${action}`, params);
    return await ipcRenderer.invoke('call-onebot-api', action, params);
  }
};

console.log('简化版API初始化完成');

contextBridge.exposeInMainWorld('electronAPI', {
  // 从主进程到渲染进程的单向通信
  onServerLog: (callback) => ipcRenderer.on('server-log', (_event, value) => callback(value)),
  onServerStatusUpdate: (callback) => ipcRenderer.on('server-status-update', (_event, value) => callback(value)),
  onWsMessage: (callback) => ipcRenderer.on('ws-message', (_event, value) => callback(value)),
  // 群组状态更新通知
  onGroupStatusUpdated: (callback) => ipcRenderer.on('group-status-updated', (_event, value) => callback(value)),
  // 群组信息更新通知
  onGroupInfoUpdated: (callback) => ipcRenderer.on('group-info-updated', (_event, value) => callback(value)),
  // 群组批量删除通知
  onGroupsBatchDeleted: (callback) => ipcRenderer.on('groups-batch-deleted', (_event, value) => callback(value)),

  // 渲染进程到主进程的请求/响应通信
  getConfig: () => ipcRenderer.invoke('get-config'),
  // 获取群组配置
  getGroupConfig: () => ipcRenderer.invoke('get-group-config'),
  // 检查群是否启用
  isGroupEnabled: (groupId) => ipcRenderer.invoke('is-group-enabled', groupId),

  // 渲染进程到主进程的单向通信
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  startServer: (config) => ipcRenderer.send('start-server', config),
  stopServer: () => ipcRenderer.send('stop-server'),
  // 保存群组配置
  saveGroupConfig: (groupConfig) => ipcRenderer.send('save-group-config', groupConfig),
  // 更改群启用状态
  toggleGroupStatus: (groupInfo) => ipcRenderer.send('toggle-group-status', groupInfo),
  // 更新群信息
  updateGroupInfo: (groupInfo) => ipcRenderer.send('update-group-info', groupInfo),
  // 批量删除群组
  batchDeleteGroups: (groupIds) => ipcRenderer.send('batch-delete-groups', groupIds),

  // 调用OneBot API (渲染进程 -> 主进程 -> OneBot客户端)
  callOneBotApi: (action, params) => ipcRenderer.invoke('call-onebot-api', action, params),

  // 清理监听器的方法
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // 提供完整的API模块对象
  api: apiObject,

  // 插件相关API
  getPlugins: async () => await ipcRenderer.invoke('get-plugins'),
  
  // 插件商店相关API
  getPluginStore: async () => await ipcRenderer.invoke('get-plugin-store'),
  installPlugin: async (pluginInfo) => await ipcRenderer.invoke('install-plugin', pluginInfo),
  checkPluginInstalled: async (pluginInfo) => await ipcRenderer.invoke('check-plugin-installed', pluginInfo),
}); 