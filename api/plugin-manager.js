/**
 * 插件管理器 - 负责加载、注册和调用插件
 */
const fs = require('fs');
const path = require('path');

class PluginManager {
    constructor(client, config) {
        this.client = client; // OneBot客户端连接
        this.config = config; // 配置对象
        this.plugins = new Map(); // 存储已加载的插件
        this.messageHandlers = []; // 消息处理器列表
        this.logger = null; // 日志记录函数
    }

    /**
     * 设置日志记录器
     * @param {Function} logger 日志记录函数
     */
    setLogger(logger) {
        this.logger = logger;
    }

    /**
     * 加载所有插件
     * @param {string} pluginsDir 插件目录路径
     */
    async loadPlugins(pluginsDir) {
        try {
            this.log(`开始加载插件，目录: ${pluginsDir}`);
            
            // 确保插件目录存在
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir, { recursive: true });
                this.log(`插件目录不存在，已创建: ${pluginsDir}`);
            }

            // 获取所有插件文件（包括子目录）
            const pluginFiles = this.findPluginFiles(pluginsDir);

            if (pluginFiles.length === 0) {
                this.log('没有找到插件文件');
                return;
            }

            this.log(`发现 ${pluginFiles.length} 个插件文件`);

            // 逐个加载插件
            for (const filePath of pluginFiles) {
                try {
                    const relativePath = path.relative(pluginsDir, filePath);
                    this.log(`正在加载插件: ${relativePath}`);
                    
                    // 删除缓存，确保重新加载最新版本
                    delete require.cache[require.resolve(filePath)];
                    
                    // 加载插件模块
                    const PluginClass = require(filePath);
                    
                    // 实例化插件并注册
                    const plugin = new PluginClass(this.client);
                    
                    // 注册插件
                    await this.registerPlugin(plugin);
                    
                    this.log(`插件加载成功: ${plugin.name || relativePath}`);
                } catch (error) {
                    this.log(`加载插件 ${filePath} 失败: ${error.message}`, 'error');
                }
            }
            
            this.log(`插件加载完成，共加载 ${this.plugins.size} 个插件`);
        } catch (error) {
            this.log(`加载插件目录失败: ${error.message}`, 'error');
        }
    }

    /**
     * 递归查找所有插件文件
     * @param {string} dir 目录路径
     * @param {Array} result 结果数组
     * @returns {Array} 插件文件路径数组
     */
    findPluginFiles(dir, result = []) {
        try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    // 递归扫描子目录
                    this.findPluginFiles(filePath, result);
                } else if (file.endsWith('.js')) {
                    // 只添加.js文件
                    result.push(filePath);
                }
            }
            
            return result;
        } catch (error) {
            this.log(`扫描目录 ${dir} 失败: ${error.message}`, 'error');
            return result;
        }
    }

    /**
     * 注册插件
     * @param {Object} plugin 插件实例
     */
    async registerPlugin(plugin) {
        try {
            // 检查插件是否有必要的属性
            if (!plugin.name) {
                throw new Error('插件缺少name属性');
            }

            // 避免重复注册同名插件
            if (this.plugins.has(plugin.name)) {
                this.log(`插件 ${plugin.name} 已存在，跳过注册`, 'warning');
                return false;
            }

            // 调用插件初始化方法（如果存在）
            if (typeof plugin.init === 'function') {
                await plugin.init();
            }

            // 注册插件的消息处理器
            if (typeof plugin.handleMessage === 'function') {
                this.messageHandlers.push(plugin.handleMessage.bind(plugin));
                this.log(`已注册 ${plugin.name} 的消息处理器`);
            } else {
                this.log(`警告: ${plugin.name} 没有定义handleMessage方法`, 'warning');
            }

            // 存储插件实例
            this.plugins.set(plugin.name, plugin);
            
            this.log(`注册插件: ${plugin.name}`);
            return true;
        } catch (error) {
            this.log(`注册插件失败: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 处理消息
     * @param {Object} message 消息对象
     * @param {Object} groupConfig 群组配置
     * @returns {Promise<boolean>} 是否有插件处理了消息
     */
    async handleMessage(message, groupConfig) {
        try {
            // 检查消息是否为群消息
            if (message.message_type === 'group') {
                const groupId = message.group_id.toString();
                
                // 检查群是否启用
                if (!this.isGroupEnabled(groupId, groupConfig)) {
                    this.log(`群 ${groupId} 未启用，跳过消息处理`);
                    return false;
                }
                
                this.log(`处理来自群 ${groupId} 的消息`);
                this.log(`消息内容: ${message.raw_message || (typeof message.message === 'string' ? message.message : JSON.stringify(message.message))}`);
            }

            // 依次调用所有插件的消息处理器
            let handled = false;
            for (const handler of this.messageHandlers) {
                try {
                    this.log(`尝试使用下一个插件处理消息...`);
                    const result = await handler(message, this.client);
                    if (result) {
                        this.log(`消息已被处理`);
                        handled = true;
                        break; // 如果有插件处理了消息，则停止继续处理
                    }
                } catch (error) {
                    this.log(`插件处理消息出错: ${error.message}`, 'error');
                }
            }
            
            if (!handled) {
                this.log(`没有插件处理此消息`);
            }
            
            return handled; // 返回是否处理了消息
        } catch (error) {
            this.log(`消息处理失败: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 检查群是否启用
     * @param {string} groupId 群ID
     * @param {Object} groupConfig 群组配置
     * @returns {boolean} 是否启用
     */
    isGroupEnabled(groupId, groupConfig) {
        try {
            // 检查群组配置中是否存在该群，且启用状态为true
            const enabled = groupConfig && 
                   groupConfig.groups && 
                   groupConfig.groups[groupId] && 
                   groupConfig.groups[groupId].enabled === true;
            
            this.log(`群 ${groupId} 状态: ${enabled ? '已启用' : '未启用'}`);
            return enabled;
        } catch (error) {
            this.log(`检查群启用状态出错: ${error.message}`, 'error');
            return false; // 出错时默认不启用
        }
    }

    /**
     * 记录日志
     * @param {string} message 日志消息
     * @param {string} type 日志类型
     */
    log(message, type = 'info') {
        // 使用设置的日志记录器（如果有）
        if (this.logger && typeof this.logger === 'function') {
            this.logger(`[插件管理器] ${message}`, type);
        } else {
            // 否则使用控制台
            console.log(`[插件管理器] ${message}`);
        }
    }
}

module.exports = PluginManager; 