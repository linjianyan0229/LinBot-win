/**
 * Echo插件 - 简单的消息回声插件
 * 当接收到以"echo"开头的群消息时，回复该消息内容
 */
class EchoPlugin {
    constructor(client) {
        this.client = client;
        this.name = 'Echo插件';
        this.description = '简单的消息回声插件，输入echo+内容来测试';
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

            // 检查消息是否以"echo"开头(不区分大小写)
            if (typeof content === 'string' && content.toLowerCase().startsWith('echo')) {
                console.log(`[${this.name}] 收到echo命令: ${content}`);
                
                // 提取echo后面的内容
                const echoContent = content.substring(4).trim();
                
                // 组装回复
                let reply = '';
                if (echoContent) {
                    reply = `[回声]：${echoContent}`;
                } else {
                    reply = '请在echo后面输入要回复的内容';
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

module.exports = EchoPlugin; 