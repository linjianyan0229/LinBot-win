/**
 * OneBot API 客户端
 * 基于 OneBot 11 标准和 NapCatQQ 扩展实现
 */
class OneBotClient {
    /**
     * 创建API客户端
     * @param {object} electronAPI Electron IPC通信接口
     */
    constructor(electronAPI) {
        this.electronAPI = electronAPI;
        this.self_id = null; // 机器人QQ号
        this.isConnected = false;
        
        console.log('[OneBotClient] 客户端初始化完成');
    }

    /**
     * 调用 API 并返回结果
     * @param {string} action API动作名称
     * @param {object} params API参数
     * @returns {Promise<object>} API返回结果
     */
    async callApi(action, params = {}) {
        try {
            console.log(`[OneBotClient] 调用API: ${action}`, params);
            
            // 生成请求标识，用于跟踪API调用
            const echo = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            
            // 构建完整请求
            const request = {
                action,
                params,
                echo
            };
            
            // 调用API并等待响应
            const response = await this.electronAPI.callOneBotApi(action, params);
            
            // 检查响应状态
            if (response && response.status === 'failed') {
                console.error(`[OneBotClient] API调用失败: ${action}`, response);
                throw new Error(response.message || '未知错误');
            }
            
            return response;
        } catch (error) {
            console.error(`[OneBotClient] API调用异常: ${action}`, error);
            
            // 封装错误对象，符合OneBot v11错误格式
            const errorResponse = {
                status: 'failed',
                retcode: error.code || -1,
                data: null,
                message: error.message || `调用API ${action} 失败`
            };
            
            throw errorResponse;
        }
    }

    /**
     * 等待API响应结果
     * @param {string} echo 请求标识
     * @param {number} timeout 超时时间(毫秒)
     * @returns {Promise<object>} API返回结果
     */
    async waitForResponse(echo, timeout = 5000) {
        // 实现等待机制，实际项目中应通过websocket消息或事件监听等方式完成
        return new Promise((resolve, reject) => {
            // 超时处理
            const timer = setTimeout(() => {
                reject({
                    status: 'failed',
                    retcode: 504,
                    data: null,
                    message: '请求超时'
                });
            }, timeout);
            
            // 这里需要实现实际的响应监听机制
            // 以下代码仅为示例
            this.electronAPI.onApiResponse(echo, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }
    
    /**
     * 获取机器人QQ号
     * @returns {Promise<string>} 机器人QQ号
     */
    async getSelfId() {
        if (this.self_id) {
            return this.self_id;
        }
        
        try {
            const loginInfo = await this.callApi('get_login_info');
            if (loginInfo && loginInfo.data && loginInfo.data.user_id) {
                this.self_id = loginInfo.data.user_id.toString();
                return this.self_id;
            }
            throw new Error('获取机器人QQ号失败');
        } catch (error) {
            console.error('[OneBotClient] 获取机器人QQ号失败', error);
            throw error;
        }
    }
    
    /**
     * 检查API连接状态
     * @returns {Promise<boolean>} 是否连接成功
     */
    async checkConnection() {
        if (this.isConnected) {
            return true;
        }
        
        try {
            // 尝试获取版本信息以检查连接
            const versionInfo = await this.callApi('get_version_info');
            this.isConnected = true;
            console.log('[OneBotClient] 连接正常，版本信息:', versionInfo);
            return true;
        } catch (error) {
            console.error('[OneBotClient] 连接检查失败', error);
            this.isConnected = false;
            return false;
        }
    }
}

module.exports = OneBotClient; 