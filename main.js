const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); // 引入 fs 模块
const WebSocketServer = require('ws').Server; // 引入ws服务端
const PluginManager = require('./api/plugin-manager'); // 引入插件管理器

// 定义配置文件的路径，区分开发环境和生产环境
const isProduction = !process.defaultApp;
let basePath = __dirname;

// 如果是打包后的应用，配置文件在extraResources目录
if (isProduction) {
  basePath = process.resourcesPath;
}

// 配置文件路径
const configPath = path.join(basePath, 'config.json');
// 群组配置路径
const groupConfigPath = path.join(basePath, 'group.json');
// 插件目录路径
const pluginsDir = path.join(basePath, 'plugins');

// 默认配置
const defaultConfig = { port: 8080, accessToken: '', showHeartbeat: true };
// 默认群组配置
const defaultGroupConfig = { groups: {} };

// 全局变量
let mainWindow;
let wss = null; // WebSocketServer实例
let connectedClient = null; // 当前连接的客户端
let groupConfig = defaultGroupConfig; // 群组配置
let pluginManager = null; // 插件管理器实例

// 用于存储API请求和响应的映射
const apiRequests = new Map();

// 读取配置文件的函数
function readConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const rawData = fs.readFileSync(configPath, 'utf-8');
            const parsedData = JSON.parse(rawData);
            // 合并默认配置，以防配置文件缺少某些键
            return { ...defaultConfig, ...parsedData };
        } else {
            // 文件不存在，写入默认配置并返回
            writeConfig(defaultConfig);
            return defaultConfig;
        }
    } catch (error) {
        console.error('读取或解析 config.json 失败:', error, `路径: ${configPath}`);
        // 出错时返回默认配置
        return defaultConfig;
    }
}

// 写入配置文件的函数
function writeConfig(config) {
    try {
        console.log(`尝试写入配置到: ${configPath}`, config);
        
        // 确保配置文件所在目录存在
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`创建配置目录: ${configDir}`);
        }
        
        const data = JSON.stringify(config, null, 2); // 使用2个空格缩进，美化输出
        fs.writeFileSync(configPath, data, 'utf-8');
        console.log(`配置已成功写入: ${configPath}`);
    } catch (error) {
        console.error('写入 config.json 失败:', error, `路径: ${configPath}`);
    }
}

// 读取群组配置文件的函数
function readGroupConfig() {
    try {
        if (fs.existsSync(groupConfigPath)) {
            const rawData = fs.readFileSync(groupConfigPath, 'utf-8');
            const parsedData = JSON.parse(rawData);
            // 合并默认配置，以防配置文件缺少某些键
            groupConfig = { ...defaultGroupConfig, ...parsedData };
            return groupConfig;
        } else {
            // 文件不存在，写入默认配置并返回
            writeGroupConfig(defaultGroupConfig);
            groupConfig = defaultGroupConfig;
            return groupConfig;
        }
    } catch (error) {
        console.error('读取或解析 group.json 失败:', error, `路径: ${groupConfigPath}`);
        // 出错时返回默认配置
        groupConfig = defaultGroupConfig;
        return groupConfig;
    }
}

// 写入群组配置文件的函数
function writeGroupConfig(config) {
    try {
        // 确保配置文件所在目录存在
        const configDir = path.dirname(groupConfigPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`创建群组配置目录: ${configDir}`);
        }
        
        // 打印配置路径
        console.log(`尝试写入群组配置到: ${groupConfigPath}`);
        console.log(`配置内容:`, JSON.stringify(config, null, 2).substring(0, 200) + '...');
        
        const data = JSON.stringify(config, null, 2);
        fs.writeFileSync(groupConfigPath, data, 'utf-8');
        
        // 检查文件是否成功写入
        if (fs.existsSync(groupConfigPath)) {
            const stats = fs.statSync(groupConfigPath);
            console.log(`群组配置已成功写入: ${groupConfigPath}, 文件大小: ${stats.size} 字节`);
            return true;
        } else {
            console.error(`群组配置写入后未找到文件: ${groupConfigPath}`);
            return false;
        }
    } catch (error) {
        console.error('写入 group.json 失败:', error, `路径: ${groupConfigPath}`);
        return false;
    }
}

function createWindow() {
  // 确定应用图标路径（区分开发环境和打包后的环境）
  let iconPath;
  
  // 判断是否是打包后的应用
  if (app.isPackaged) {
    // 打包后的环境，图标在resources目录
    iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'favicon.ico');
    
    // 备选路径
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(process.resourcesPath, 'assets', 'favicon.ico');
    }
  } else {
    // 开发环境，图标在项目目录
    iconPath = path.join(__dirname, 'assets', 'favicon.ico');
  }
  
  console.log(`尝试加载应用图标: ${iconPath}`);
  
  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath, // 设置窗口图标
    title: 'LinBot UI', // 设置窗口标题
    webPreferences: {
      nodeIntegration: false, // 禁用Node集成
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js') // 指定预加载脚本
    }
  });

  mainWindow.loadFile('index.html');
  
  // 再次设置图标（兼容性处理）
  if (fs.existsSync(iconPath)) {
    mainWindow.setIcon(iconPath);
    console.log('窗口图标已设置');
  } else {
    console.warn(`图标文件不存在: ${iconPath}`);
  }
  
  // 开发时打开开发者工具
  if (process.argv.includes('--debug')) {
    mainWindow.webContents.openDevTools();
  }
}

// 向渲染进程发送消息
function sendToRenderer(channel, ...args) {
  // 增加检查：确保窗口存在且未被销毁
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  } else {
      // 可选：在这里添加日志，表明无法发送消息，因为窗口已关闭
      // console.log(`窗口已关闭，无法发送消息到渲染进程: ${channel}`);
  }
}

// 启动WebSocket服务器
function startServer(port, accessToken) {
  if (wss) {
    sendToRenderer('server-log', '服务器已经在运行中。');
    return;
  }
  try {
    wss = new WebSocketServer({ port });
    sendToRenderer('server-log', `WebSocket服务器正在监听端口: ${port}`);
    sendToRenderer('server-status-update', { isRunning: true, port: port, clientConnected: !!connectedClient });

    // 确保已加载群组配置
    if (!groupConfig) {
      groupConfig = readGroupConfig();
    }

    wss.on('connection', (ws, req) => {
      // 简单的Token验证 (可以在Header或URL参数中传递)
      // 注意：OneBot标准反向WS通常在Header 'Authorization: Bearer YOUR_TOKEN' 中传递
      const authHeader = req.headers['authorization'];
      const token = authHeader ? authHeader.split(' ')[1] : null;

      if (accessToken && token !== accessToken) {
          sendToRenderer('server-log', `客户端连接尝试失败：无效的 Access Token (${token || '未提供'})`);
          ws.close(1008, 'Invalid Access Token');
          return;
      }

      if (connectedClient) {
          sendToRenderer('server-log', '已有客户端连接，拒绝新的连接。');
          ws.close(1013, 'Server already has a client'); // 1013 Try again later
          return;
      }

      connectedClient = ws;
      const clientIp = req.socket.remoteAddress;
      sendToRenderer('server-log', `客户端已连接: ${clientIp}`);
      sendToRenderer('server-status-update', { isRunning: true, port: port, clientConnected: true });

      // 为WebSocket客户端添加callApi方法，使插件能够调用OneBot API
      connectedClient.callApi = async function(action, params = {}) {
          try {
              if (!connectedClient || connectedClient.readyState !== connectedClient.OPEN) {
                  console.log('API调用失败: 客户端未连接', {action, params});
                  return { status: 'failed', retcode: -1, message: '客户端未连接或连接未就绪' };
              }
              
              const echo = `api_${action}_${Date.now().toString()}`; // 使用API名称和时间戳作为echo
              const request = JSON.stringify({ action, params, echo });
              
              // 创建一个Promise用于等待响应
              const responsePromise = new Promise((resolve, reject) => {
                  // 设置超时，5秒后如果没有收到响应则reject
                  const timeoutId = setTimeout(() => {
                      apiRequests.delete(echo);
                      reject(new Error('API请求超时'));
                  }, 5000);
                  
                  // 存储请求信息和resolve/reject函数
                  apiRequests.set(echo, { resolve, reject, timeoutId });
              });
              
              // 发送请求
              sendToRenderer('server-log', `发送API请求: ${request}`);
              connectedClient.send(request);
              console.log(`API请求已发送: action=${action}, echo=${echo}`);
              
              try {
                  // 等待响应
                  return await responsePromise;
              } catch (error) {
                  console.error('API响应处理失败:', error);
                  return { status: 'failed', retcode: -3, message: `响应处理失败: ${error.message}` };
              }
          } catch (error) {
              console.error('API调用失败:', error, {action, params});
              sendToRenderer('server-log', `发送API请求失败: ${error.message}`);
              return { status: 'failed', retcode: -2, message: `发送失败: ${error.message}` };
          }
      };

      // 创建插件管理器
      pluginManager = new PluginManager(connectedClient, readConfig());
      pluginManager.setLogger((message, type) => {
        sendToRenderer('server-log', message, type);
      });

      // 加载插件
      pluginManager.loadPlugins(pluginsDir)
        .then(() => {
          sendToRenderer('server-log', '插件加载完成');
        })
        .catch(err => {
          sendToRenderer('server-log', `加载插件出错: ${err.message}`, 'error');
        });

      ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            
            // 记录接收到的消息（除非是心跳消息且设置了不显示）
            const isHeartbeat = parsedMessage.post_type === 'meta_event' && 
                                parsedMessage.meta_event_type === 'heartbeat';
            
            const config = readConfig();
            if (!isHeartbeat || config.showHeartbeat) {
                sendToRenderer('server-log', `收到客户端消息: ${message}`);
            }
            
            // 处理不同类型的消息
            if (parsedMessage.post_type === 'message') {
                // 发送到渲染进程
                sendToRenderer('ws-message', parsedMessage);
                
                // 让插件管理器处理消息
                if (pluginManager) {
                    try {
                        await pluginManager.handleMessage(parsedMessage, groupConfig);
                    } catch (pluginError) {
                        sendToRenderer('server-log', `插件处理消息出错: ${pluginError.message}`, 'error');
                    }
                }
            } 
            // 检查是否是API响应
            else if (parsedMessage.echo && apiRequests.has(parsedMessage.echo)) {
                const { resolve, reject, timeoutId } = apiRequests.get(parsedMessage.echo);
                
                // 清除超时计时器
                clearTimeout(timeoutId);
                
                // 从映射中删除请求
                apiRequests.delete(parsedMessage.echo);
                
                // 解析API响应状态
                if (parsedMessage.status === 'failed' || parsedMessage.retcode !== 0) {
                    sendToRenderer('server-log', `API响应失败: ${parsedMessage.message || '未知错误'}`);
                } else {
                    sendToRenderer('server-log', `API响应成功: ${parsedMessage.echo}`);
                }
                
                // 解析响应
                resolve(parsedMessage);
            } else {
                // 其他类型的消息，发送到渲染进程
                sendToRenderer('ws-message', parsedMessage);
            }
        } catch(e) {
            sendToRenderer('server-log', `无法解析收到的消息: ${e}`);
        }
      });

      ws.on('close', (code, reason) => {
        sendToRenderer('server-log', `客户端断开连接: Code ${code}, Reason: ${reason || 'N/A'}`);
        connectedClient = null;
        pluginManager = null; // 清除插件管理器
        if (wss) { 
             sendToRenderer('server-status-update', { isRunning: true, port: wss.options.port, clientConnected: false });
        } else {
             sendToRenderer('server-status-update', { isRunning: false, port: null, clientConnected: false });
        }
      });

      ws.on('error', (error) => {
        sendToRenderer('server-log', `客户端WebSocket错误: ${error.message}`);
        if(connectedClient === ws){
             connectedClient = null;
             pluginManager = null; // 清除插件管理器
             if (wss) {
                 sendToRenderer('server-status-update', { isRunning: true, port: wss.options.port, clientConnected: false });
             } else {
                 sendToRenderer('server-status-update', { isRunning: false, port: null, clientConnected: false });
             }
        }
      });
    });

    wss.on('error', (error) => {
      sendToRenderer('server-log', `服务器错误: ${error.message}`);
      stopServer(); // 出错时尝试停止服务器
    });

  } catch (error) {
      console.error('启动服务器出错:', error);
      sendToRenderer('server-log', `启动服务器失败: ${error.message}`);
      stopServer();
  }
}

// 停止WebSocket服务器
function stopServer() {
  try {
    if (wss) {
      if (connectedClient) {
          connectedClient.close(1001, 'Server shutting down'); // 1001 Going Away
          connectedClient = null;
      }
      wss.close((err) => {
          if (err) {
              sendToRenderer('server-log', `关闭服务器时出错: ${err.message}`);
          } else {
              sendToRenderer('server-log', 'WebSocket服务器已停止。');
          }
      });
      wss = null;
      pluginManager = null; // 清除插件管理器
      sendToRenderer('server-status-update', { isRunning: false, port: null, clientConnected: false });
    } else {
       sendToRenderer('server-log', '服务器未运行。');
    }
  } catch (error) {
    console.error('停止服务器出错:', error);
    sendToRenderer('server-log', `停止服务器时发生错误: ${error.message}`);
  }
}

// 全局错误处理，避免应用崩溃
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 可以在这里添加错误处理逻辑，例如显示错误对话框等
});

// 设置应用ID（解决Windows任务栏图标问题）
if (process.platform === 'win32') {
  app.setAppUserModelId('com.linbot.ui');
}

app.whenReady().then(() => {
  console.log('应用准备就绪，正在创建窗口...');
  createWindow();
  console.log('主窗口已创建');
}).catch(error => {
  console.error('应用启动失败:', error);
});

app.on('window-all-closed', () => {
  stopServer(); // 关闭窗口前停止服务器
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC 处理 ---

// 保存配置
ipcMain.on('save-config', (event, config) => {
  try {
    console.log('收到保存配置请求:', config);
    
    // 验证配置有效性
    if (!config || typeof config !== 'object') {
      console.error('无效的配置对象:', config);
      return;
    }
    
    // 确保配置字段类型正确
    const validatedConfig = {
      port: typeof config.port === 'number' ? config.port : 8080,
      accessToken: typeof config.accessToken === 'string' ? config.accessToken : '',
      showHeartbeat: typeof config.showHeartbeat === 'boolean' ? config.showHeartbeat : true
    };
    
    // 写入配置
    writeConfig(validatedConfig);
    
    // 通知渲染进程配置已保存
    sendToRenderer('server-log', `配置已保存: 端口=${validatedConfig.port}`);
    console.log('配置已成功保存');
  } catch (error) {
    console.error('保存配置失败:', error);
    sendToRenderer('server-log', `保存配置失败: ${error.message}`);
  }
});

// 获取配置
ipcMain.handle('get-config', async (event) => {
  return readConfig();
});

// 启动服务器请求
ipcMain.on('start-server', (event, config) => {
  try {
    // 确保config是一个简单对象，提取需要的字段
    const port = config && typeof config.port === 'number' ? config.port : 8080;
    const accessToken = config && typeof config.accessToken === 'string' ? config.accessToken : '';
    
    console.log(`收到启动服务器请求: port=${port}, token=${accessToken ? '已设置' : '未设置'}`);
    sendToRenderer('server-log', `正在启动服务器，端口: ${port}...`);
    
    startServer(port, accessToken);
  } catch (error) {
    console.error('处理start-server事件出错:', error);
    sendToRenderer('server-log', `启动服务器时发生错误: ${error.message}`);
  }
});

// 停止服务器请求
ipcMain.on('stop-server', (event) => {
  try {
    sendToRenderer('server-log', '正在停止服务器...');
    stopServer();
  } catch (error) {
    console.error('处理stop-server事件出错:', error);
    sendToRenderer('server-log', `停止服务器时发生错误: ${error.message}`);
  }
});

// 获取群组配置
ipcMain.handle('get-group-config', async (event) => {
  return readGroupConfig();
});

// 保存群组配置
ipcMain.on('save-group-config', (event, newConfig) => {
  try {
    console.log('收到保存群组配置请求:', newConfig);
    
    // 验证配置有效性
    if (!newConfig || typeof newConfig !== 'object') {
      console.error('无效的群组配置对象:', newConfig);
      return;
    }
    
    // 确保groups属性存在
    if (!newConfig.groups) {
      newConfig.groups = {};
    }
    
    // 写入配置
    const result = writeGroupConfig(newConfig);
    
    if (result) {
      // 更新全局变量
      groupConfig = newConfig;
      
      // 通知渲染进程配置已保存
      sendToRenderer('server-log', `群组配置已保存，共 ${Object.keys(newConfig.groups).length} 个群组`);
    } else {
      sendToRenderer('server-log', `保存群组配置失败`, 'error');
    }
  } catch (error) {
    console.error('保存群组配置失败:', error);
    sendToRenderer('server-log', `保存群组配置失败: ${error.message}`, 'error');
  }
});

// 切换群组状态
ipcMain.on('toggle-group-status', (event, data) => {
  const { groupId, enabled } = data;
  const groupConfig = readGroupConfig();
  
  if (groupConfig.groups[groupId]) {
    groupConfig.groups[groupId].enabled = enabled;
    writeGroupConfig(groupConfig);
    
    // 通知渲染进程状态已更新
    mainWindow.webContents.send('group-status-updated', { 
      groupId: groupId, 
      enabled: enabled 
    });
  }
});

// 更新群组信息
ipcMain.on('update-group-info', (event, groupInfo) => {
  const groupConfig = readGroupConfig();
  
  if (groupConfig.groups[groupInfo.id]) {
    groupConfig.groups[groupInfo.id] = {
      ...groupConfig.groups[groupInfo.id],
      ...groupInfo
    };
    writeGroupConfig(groupConfig);
    
    // 通知渲染进程信息已更新
    mainWindow.webContents.send('group-info-updated', groupInfo);
  }
});

// 主进程向渲染进程发送API调用的请求
ipcMain.handle('call-onebot-api', async (event, action, params) => {
    try {
        if (!connectedClient || connectedClient.readyState !== connectedClient.OPEN) {
            console.log('API调用失败: 客户端未连接', {action, params});
            return { status: 'failed', retcode: -1, message: '客户端未连接或连接未就绪' };
        }
        
        const echo = `api_${action}_${Date.now().toString()}`; // 使用API名称和时间戳作为echo
        const request = JSON.stringify({ action, params, echo });
        
        // 创建一个Promise用于等待响应
        const responsePromise = new Promise((resolve, reject) => {
            // 设置超时，5秒后如果没有收到响应则reject
            const timeoutId = setTimeout(() => {
                apiRequests.delete(echo);
                reject(new Error('API请求超时'));
            }, 5000);
            
            // 存储请求信息和resolve/reject函数
            apiRequests.set(echo, { resolve, reject, timeoutId });
        });
        
        // 发送请求
        sendToRenderer('server-log', `发送API请求: ${request}`);
        connectedClient.send(request);
        console.log(`API请求已发送: action=${action}, echo=${echo}`);
        
        try {
            // 等待响应
            return await responsePromise;
        } catch (error) {
            console.error('API响应处理失败:', error);
            return { status: 'failed', retcode: -3, message: `响应处理失败: ${error.message}` };
        }
    } catch (error) {
        console.error('API调用失败:', error, {action, params});
        sendToRenderer('server-log', `发送API请求失败: ${error.message}`);
        return { status: 'failed', retcode: -2, message: `发送失败: ${error.message}` };
    }
});

// 判断群是否启用
ipcMain.handle('is-group-enabled', async (event, groupId) => {
  const groupConfig = readGroupConfig();
  return groupConfig.groups[groupId]?.enabled === true;
});

// 获取插件列表
ipcMain.handle('get-plugins', async (event) => {
  if (!pluginManager) {
    return { error: '服务器未运行或插件系统未初始化' };
  }
  
  try {
    // 收集插件信息
    const pluginsList = [];
    for (const [name, plugin] of pluginManager.plugins) {
      // 提取插件路径和分组信息
      const pluginPath = plugin.filePath || '';
      const relativePath = pluginPath.replace(pluginsDir, '').split(path.sep).filter(p => p.length > 0);
      const group = relativePath.length > 0 ? relativePath[0] : '默认';
      
      pluginsList.push({
        name: name,
        description: plugin.description || '无描述信息',
        path: pluginPath.replace(pluginsDir, ''),
        group: group,
        status: 'active'
      });
    }
    
    return { 
      success: true, 
      plugins: pluginsList,
      count: pluginsList.length
    };
  } catch (error) {
    console.error('获取插件列表出错:', error);
    return { 
      error: `获取插件列表失败: ${error.message}` 
    };
  }
}); 