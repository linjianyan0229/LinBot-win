/**
 * 天气插件 - 模拟天气查询功能
 * 当接收到"天气 城市名"格式的消息时，返回该城市的天气信息
 */
class WeatherPlugin {
    constructor(client) {
        this.client = client;
        this.name = '天气插件';
        this.description = '查询城市天气，格式: 天气 城市名';
        this.weatherData = {
            '北京': '晴，26°C，微风',
            '上海': '多云，28°C，东南风3级',
            '广州': '阵雨，30°C，微风',
            '深圳': '雷阵雨，29°C，东风2级',
            '杭州': '晴，27°C，东北风2级',
            '成都': '阴，24°C，微风',
            '武汉': '多云，25°C，微风',
            '西安': '晴，23°C，西北风3级',
            '南京': '晴，26°C，微风',
            '重庆': '多云，25°C，微风'
        };
        console.log(`[${this.name}] 插件已加载`);
    }

    /**
     * 插件初始化方法
     */
    async init() {
        console.log(`[${this.name}] 插件初始化完成`);
    }

    /**
     * 处理消息
     * @param {Object} message 消息对象
     * @returns {Promise<boolean>} 是否处理了消息
     */
    async handleMessage(message) {
        try {
            // 只处理群聊消息
            if (message.message_type !== 'group') {
                return false;
            }

            // 获取消息内容和群号
            const content = message.raw_message || message.message;
            const groupId = message.group_id;
            const userId = message.user_id;

            console.log(`[${this.name}] 收到消息: ${content}, 类型: ${typeof content}`);

            // 检查消息是否符合"天气 城市名"的格式
            if (typeof content === 'string' && content.startsWith('天气')) {
                console.log(`[${this.name}] 收到天气查询命令: ${content}`);
                
                // 提取城市名
                const city = content.substring(2).trim();
                
                // 组装回复
                let reply = '';
                if (!city) {
                    reply = '请输入要查询的城市，例如: 天气 北京';
                } else if (this.weatherData[city]) {
                    reply = `${city}天气: ${this.weatherData[city]}`;
                } else {
                    reply = `抱歉，暂不支持查询${city}的天气信息`;
                }
                
                console.log(`[${this.name}] 准备回复: ${reply}, 群号: ${groupId}`);
                
                // 发送群消息
                try {
                    const result = await this.client.callApi('send_group_msg', {
                        group_id: groupId,
                        message: reply
                    });
                    console.log(`[${this.name}] 发送消息结果:`, result);
                } catch (sendError) {
                    console.error(`[${this.name}] 发送消息失败:`, sendError);
                }
                
                return true; // 表示已处理该消息
            }
            
            return false; // 未处理该消息
        } catch (error) {
            console.error(`[${this.name}] 处理消息出错:`, error);
            return false;
        }
    }
}

module.exports = WeatherPlugin; 