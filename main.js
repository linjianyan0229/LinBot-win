const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); // 引入 fs 模块
const WebSocketServer = require('ws').Server; // 引入ws服务端
const PluginManager = require('./api/plugin-manager'); // 引入插件管理器
const Module = require('module'); // 引入Module模块
const https = require('https'); // 引入https模块，用于GitHub API请求

// 定义配置文件的路径，区分开发环境和生产环境
const isProduction = !process.defaultApp;
let basePath = __dirname;

// 如果是打包后的应用，配置文件在extraResources目录
if (isProduction) {
  basePath = process.resourcesPath;
  
  // 添加额外的模块解析路径，使插件能够访问安装在resources/node_modules的依赖
  const resourcesNodeModulesPath = path.join(process.resourcesPath, 'node_modules');
  if (fs.existsSync(resourcesNodeModulesPath)) {
    console.log(`添加额外的模块解析路径: ${resourcesNodeModulesPath}`);
    // 将resources/node_modules添加到模块解析路径
    Module.globalPaths.push(resourcesNodeModulesPath);
  } else {
    console.warn(`资源目录下的node_modules不存在: ${resourcesNodeModulesPath}`);
  }
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

// 从GitHub API获取数据
async function fetchFromGitHub(endpoint) {
    try {
        // 获取系统代理设置
        const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
        
        // 创建请求选项
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'LinBot-Plugin-Manager',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        return new Promise((resolve, reject) => {
            let req;
            
            if (httpProxy) {
                // 使用代理
                const HttpsProxyAgent = require('https-proxy-agent');
                const agent = new HttpsProxyAgent(httpProxy);
                options.agent = agent;
                req = https.request(options, (res) => handleResponse(res, resolve, reject));
            } else {
                // 直接请求
                req = https.request(options, (res) => handleResponse(res, resolve, reject));
            }
            
            req.on('error', (error) => {
                console.error(`GitHub API请求错误: ${error.message}`);
                reject(error);
            });
            
            req.end();
        });
    } catch (error) {
        console.error(`请求GitHub API时出错: ${error.message}`);
        throw error;
    }
}

// 处理GitHub API响应
function handleResponse(res, resolve, reject) {
    if (res.statusCode !== 200) {
        reject(new Error(`GitHub API请求失败: ${res.statusCode} ${res.statusMessage}`));
        return;
    }
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
        } catch (error) {
            reject(new Error(`解析GitHub API响应时出错: ${error.message}`));
        }
    });
}

// 从GitHub下载插件文件
async function downloadPluginFile(downloadUrl, targetPath) {
    try {
        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        await fs.promises.mkdir(targetDir, { recursive: true });
        
        // 获取系统代理设置
        const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
        
        return new Promise((resolve, reject) => {
            // 使用代理或直接下载
            let req;
            
            if (httpProxy) {
                // 使用代理下载
                const HttpsProxyAgent = require('https-proxy-agent');
                const agent = new HttpsProxyAgent(httpProxy);
                req = https.get(downloadUrl, { agent, headers: { 'User-Agent': 'LinBot-Plugin-Manager' } }, (res) => {
                    handleDownload(res, targetPath, resolve, reject);
                });
            } else {
                // 直接下载
                req = https.get(downloadUrl, { headers: { 'User-Agent': 'LinBot-Plugin-Manager' } }, (res) => {
                    handleDownload(res, targetPath, resolve, reject);
                });
            }
            
            req.on('error', (error) => {
                console.error(`下载文件失败: ${error.message}`);
                reject(error);
            });
        });
    } catch (error) {
        console.error(`下载文件时出错: ${error.message}`);
        throw error;
    }
}

// 处理文件下载
function handleDownload(res, targetPath, resolve, reject) {
    if (res.statusCode !== 200) {
        reject(new Error(`下载失败: ${res.statusCode} ${res.statusMessage}`));
        return;
    }
    
    const fileStream = fs.createWriteStream(targetPath);
    res.pipe(fileStream);
    
    fileStream.on('finish', () => {
        fileStream.close();
        resolve({ success: true, path: targetPath });
    });
    
    fileStream.on('error', (error) => {
        fs.unlink(targetPath, () => {});
        reject(error);
    });
}

// 获取插件仓库内容
async function getPluginStoreContent() {
  try {
    console.log('正在获取插件仓库内容...');
    
    // 获取仓库根目录内容
    const rootContent = await fetchFromGitHub('/repos/linjianyan0229/linbot-plugins/contents');
    
    // 查找群聊和私聊插件目录
    const pluginDirs = rootContent.filter(item => 
      item.type === 'dir' && 
      (item.name === '群聊插件' || item.name === '群聊+私聊插件')
    );
    
    // 获取每个插件目录的内容
    const pluginsList = [];
    
    for (const dir of pluginDirs) {
      const dirContent = await fetchFromGitHub(`/repos/linjianyan0229/linbot-plugins/contents/${encodeURIComponent(dir.path)}`);
      
      // 检查是否是空目录
      if (!Array.isArray(dirContent) || dirContent.length === 0) {
        continue;
      }
      
      // 遍历目录中的插件
      for (const item of dirContent) {
        if (item.type === 'dir') {
          try {
            // 获取插件目录中的文件
            const pluginFiles = await fetchFromGitHub(`/repos/linjianyan0229/linbot-plugins/contents/${encodeURIComponent(item.path)}`);
            
            // 检查插件目录是否包含.js文件
            const jsFiles = pluginFiles.filter(file => file.name.endsWith('.js'));
            const readmeFile = pluginFiles.find(file => file.name.toLowerCase() === 'readme.md');
            
            // 如果有JS文件，则认为是有效插件
            if (jsFiles.length > 0) {
              // 尝试从readme提取描述
              let description = '无描述信息';
              if (readmeFile) {
                try {
                  const readmeContent = await fetchFromGitHub(`/repos/linjianyan0229/linbot-plugins/contents/${encodeURIComponent(readmeFile.path)}`);
                  const decodedContent = Buffer.from(readmeContent.content, 'base64').toString('utf8');
                  // 提取第一行作为描述
                  const firstLine = decodedContent.split('\n')[0].replace(/^#\s*/, '').trim();
                  if (firstLine) {
                    description = firstLine;
                  }
                } catch (readmeError) {
                  console.error(`获取README失败: ${readmeError.message}`);
                }
              }
              
              pluginsList.push({
                name: item.name,
                path: item.path,
                type: dir.name,
                files: jsFiles.map(file => ({
                  name: file.name,
                  path: file.path,
                  download_url: file.download_url
                })),
                description: description,
                last_updated: new Date().toISOString() // GitHub API不直接提供最后更新时间
              });
            }
          } catch (subError) {
            console.error(`获取插件 ${item.name} 详情失败: ${subError.message}`);
          }
        }
      }
    }
    
    return {
      success: true,
      plugins: pluginsList,
      count: pluginsList.length,
      fetched_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('获取插件商店数据失败:', error);
    return {
      success: false,
      error: `获取插件商店数据失败: ${error.message}`
    };
  }
}

// 使用CDN替代下载
function getAlternativeDownloadUrl(originalUrl) {
  // 尝试使用几个可能的GitHub镜像
  const mirrors = [
    { 
      from: 'https://raw.githubusercontent.com', 
      to: 'https://raw.staticdn.net' 
    },
    { 
      from: 'https://raw.githubusercontent.com', 
      to: 'https://cdn.jsdelivr.net/gh' 
    },
    { 
      from: 'https://raw.githubusercontent.com', 
      to: 'https://ghproxy.com/https://raw.githubusercontent.com' 
    }
  ];
  
  // 生成备选下载链接
  const alternativeUrls = [];
  
  // 原始URL保持不变
  alternativeUrls.push(originalUrl);
  
  // 添加来自镜像的URL
  for (const mirror of mirrors) {
    if (originalUrl.startsWith(mirror.from)) {
      // 对于jsdelivr，需要特殊处理URL
      if (mirror.to.includes('jsdelivr.net')) {
        // 从原始URL提取路径部分
        // https://raw.githubusercontent.com/linjianyan0229/linbot-plugins/main/path/to/file.js
        // 转换为
        // https://cdn.jsdelivr.net/gh/linjianyan0229/linbot-plugins@main/path/to/file.js
        const parts = originalUrl.replace('https://raw.githubusercontent.com/', '').split('/');
        const user = parts[0];
        const repo = parts[1];
        const branch = parts[2];
        const path = parts.slice(3).join('/');
        const newUrl = `${mirror.to}/${user}/${repo}@${branch}/${path}`;
        alternativeUrls.push(newUrl);
      } else {
        // 普通替换
        alternativeUrls.push(originalUrl.replace(mirror.from, mirror.to));
      }
    }
  }
  
  // 添加直接IP访问的方法（如果有）
  // ... 可以在这里添加更多备选方案
  
  return alternativeUrls;
}

// 安装插件
async function installPlugin(pluginInfo) {
  try {
    console.log(`开始安装插件: ${pluginInfo.name} (${pluginInfo.type})`);
    sendToRenderer('server-log', `开始安装插件: ${pluginInfo.name} (${pluginInfo.type})`);
    
    // 创建插件目录路径
    const pluginTypeDir = pluginInfo.type; // 例如 "群聊插件" 或 "群聊+私聊插件"
    const pluginDir = path.join(pluginsDir, pluginTypeDir, pluginInfo.name);
    
    // 确保插件目录存在
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    
    // 下载插件的所有文件
    const downloadResults = [];
    
    for (const file of pluginInfo.files) {
      // 获取所有可能的下载链接
      const downloadUrls = getAlternativeDownloadUrl(file.download_url);
      
      // 变量用于跟踪是否下载成功
      let downloadSuccess = false;
      let lastError = null;
      
      // 尝试每个下载链接
      for (const downloadUrl of downloadUrls) {
        const targetPath = path.join(pluginDir, file.name);
        console.log(`尝试下载文件: ${downloadUrl} -> ${targetPath}`);
        sendToRenderer('server-log', `尝试下载文件: ${file.name}`);
        
        try {
          const result = await downloadPluginFile(downloadUrl, targetPath);
          downloadResults.push({
            file: file.name,
            success: true,
            path: result.path
          });
          
          downloadSuccess = true;
          sendToRenderer('server-log', `文件 ${file.name} 下载成功`);
          break; // 下载成功，跳出循环
        } catch (error) {
          console.error(`使用 ${downloadUrl} 下载文件 ${file.name} 失败:`, error);
          lastError = error;
          // 继续尝试下一个链接
        }
      }
      
      // 如果所有链接都失败
      if (!downloadSuccess) {
        console.error(`所有下载源都无法下载文件 ${file.name}:`, lastError);
        sendToRenderer('server-log', `文件 ${file.name} 下载失败: ${lastError.message}`, 'error');
        
        downloadResults.push({
          file: file.name,
          success: false,
          error: lastError?.message || '所有下载源均失败'
        });
      }
    }
    
    // 检查是否所有文件都下载成功
    const allSuccess = downloadResults.every(result => result.success);
    
    // 获取成功下载的文件数量
    const successCount = downloadResults.filter(result => result.success).length;
    const totalCount = downloadResults.length;
    
    // 准备结果
    const result = {
      success: allSuccess,
      plugin: pluginInfo.name,
      results: downloadResults,
      message: allSuccess 
        ? `插件 ${pluginInfo.name} 安装成功` 
        : `插件 ${pluginInfo.name} 部分文件(${successCount}/${totalCount})安装成功`
    };
    
    // 记录最终结果
    console.log(`插件 ${pluginInfo.name} 安装${allSuccess ? '成功' : '部分成功'}:`, result);
    sendToRenderer('server-log', result.message, allSuccess ? 'info' : 'error');
    
    return result;
  } catch (error) {
    console.error(`安装插件 ${pluginInfo.name} 失败:`, error);
    sendToRenderer('server-log', `安装插件 ${pluginInfo.name} 失败: ${error.message}`, 'error');
    
    return {
      success: false,
      plugin: pluginInfo.name,
      error: error.message
    };
  }
}

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
      preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本
      devTools: !app.isPackaged // 仅在开发环境启用开发者工具
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
  
  // 生产环境下禁用开发者工具
  if (app.isPackaged) {
    // 禁用开发者工具
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
    
    // 禁用常见的开发者工具快捷键
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if ((input.control || input.meta) && input.key.toLowerCase() === 'i' || // Ctrl+I/Cmd+I
          (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'j' || // Ctrl+Shift+J/Cmd+Shift+J
          input.key === 'f12' || // F12
          (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'c') { // Ctrl+Shift+C/Cmd+Shift+C
        event.preventDefault();
      }
    });
  } 
  // 开发时打开开发者工具
  else if (process.argv.includes('--debug')) {
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

// 在生产环境中全局禁用开发者工具
if (app.isPackaged) {
  app.commandLine.appendSwitch('disable-site-isolation-trials');
}

app.whenReady().then(() => {
  console.log('应用准备就绪，正在创建窗口...');
  createWindow();
  console.log('主窗口已创建');
  
  // 在生产环境下禁用所有窗口的开发者工具
  if (app.isPackaged) {
    console.log('生产环境，禁用开发者工具');
    // 全局禁用DevTools
    app.on('browser-window-created', (event, win) => {
      win.webContents.on('devtools-opened', () => {
        win.webContents.closeDevTools();
      });
    });
  }
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

// 获取插件商店数据
ipcMain.handle('get-plugin-store', async (event) => {
  try {
    return await getPluginStoreContent();
  } catch (error) {
    console.error('获取插件商店数据失败:', error);
    return { success: false, error: error.message };
  }
});

// 安装插件
ipcMain.handle('install-plugin', async (event, pluginInfo) => {
  try {
    return await installPlugin(pluginInfo);
  } catch (error) {
    console.error('安装插件失败:', error);
    return { success: false, error: error.message };
  }
});

// 检查插件是否已安装
ipcMain.handle('check-plugin-installed', async (event, pluginInfo) => {
  try {
    const pluginTypeDir = pluginInfo.type; // 例如 "群聊插件" 或 "群聊+私聊插件"
    const pluginPath = path.join(pluginsDir, pluginTypeDir, pluginInfo.name);
    
    // 检查插件目录是否存在
    const exists = fs.existsSync(pluginPath);
    
    // 如果存在，检查是否包含与商店相同的JS文件
    let filesMatch = false;
    if (exists) {
      const files = fs.readdirSync(pluginPath);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      // 检查每个商店文件是否存在
      const storeJsFiles = pluginInfo.files.map(f => f.name).filter(name => name.endsWith('.js'));
      filesMatch = storeJsFiles.every(storeFile => jsFiles.includes(storeFile));
    }
    
    return {
      installed: exists && filesMatch,
      path: pluginPath
    };
  } catch (error) {
    console.error('检查插件安装状态失败:', error);
    return { installed: false, error: error.message };
  }
}); 