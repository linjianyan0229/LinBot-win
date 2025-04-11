/**
 * OneBot API 客户端
 * 基于 OneBot 11 标准和 NapCatQQ 扩展实现
 */
class OneBotClient {
    constructor(electronAPI) {
        this.electronAPI = electronAPI;
    }

    /**
     * 调用 API 并返回结果
     * @param {string} action API动作名称
     * @param {object} params API参数
     * @returns {Promise<object>} API返回结果
     */
    async callApi(action, params = {}) {
        try {
            return await this.electronAPI.callOneBotApi(action, params);
        } catch (error) {
            console.error(`API调用失败: ${action}`, error);
            throw error;
        }
    }

    /**
     * 等待API响应结果
     * 这个方法目前只是一个占位，实际实现需要通过websocket消息来配对请求和响应
     * @param {string} echo 请求标识
     * @param {number} timeout 超时时间(毫秒)
     */
    async waitForResponse(echo, timeout = 5000) {
        // 目前只返回一个pending状态，实际项目中应该实现等待机制
        return { status: 'pending', message: '请求已发送，请查看事件日志了解响应' };
    }
}

module.exports = OneBotClient; 