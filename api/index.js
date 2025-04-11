/**
 * OneBot API 模块主入口
 * 封装所有OneBot API接口
 */
const OneBotClient = require('./client');
const MessageApi = require('./message');
const GroupApi = require('./group');
const FriendApi = require('./friend');
const AccountApi = require('./account');
const MediaApi = require('./media');

/**
 * API主类，统一管理所有API接口
 */
class ApiManager {
    /**
     * 创建API管理器
     * @param {object} electronAPI Electron IPC通信接口
     */
    constructor(electronAPI) {
        // 基础API客户端
        this.client = new OneBotClient(electronAPI);
        
        // 消息相关API
        this.message = new MessageApi(this.client);
        
        // 群组相关API
        this.group = new GroupApi(this.client);
        
        // 好友相关API
        this.friend = new FriendApi(this.client);
        
        // 账号相关API
        this.account = new AccountApi(this.client);
        
        // 多媒体和文件相关API
        this.media = new MediaApi(this.client);
    }
    
    /**
     * 直接调用API
     * @param {string} action API动作名称
     * @param {object} params API参数
     * @returns {Promise<object>} API返回结果
     */
    async call(action, params = {}) {
        return await this.client.callApi(action, params);
    }
}

// 导出所有类
module.exports = {
    ApiManager,
    OneBotClient,
    MessageApi,
    GroupApi,
    FriendApi,
    AccountApi,
    MediaApi
}; 