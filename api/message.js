/**
 * 消息相关API封装
 * 基于OneBot v11标准实现
 * 参考：https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 */
class MessageApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 发送私聊消息
     * @param {number|string} user_id 对方 QQ 号
     * @param {string|array} message 要发送的内容
     * @param {boolean} auto_escape 消息内容是否作为纯文本发送
     * @returns {Promise<object>} 返回结果，包含message_id
     */
    async sendPrivateMsg(user_id, message, auto_escape = false) {
        const params = {
            user_id: Number(user_id) || user_id,
            message,
            auto_escape
        };
        
        try {
            const result = await this.client.callApi('send_private_msg', params);
            return result;
        } catch (error) {
            console.error('[MessageApi] 发送私聊消息失败', error);
            throw error;
        }
    }

    /**
     * 发送群消息
     * @param {number|string} group_id 群号
     * @param {string|array} message 要发送的内容
     * @param {boolean} auto_escape 消息内容是否作为纯文本发送
     * @returns {Promise<object>} 返回结果，包含message_id
     */
    async sendGroupMsg(group_id, message, auto_escape = false) {
        const params = {
            group_id: Number(group_id) || group_id,
            message,
            auto_escape
        };
        
        try {
            const result = await this.client.callApi('send_group_msg', params);
            return result;
        } catch (error) {
            console.error('[MessageApi] 发送群消息失败', error);
            throw error;
        }
    }

    /**
     * 发送消息
     * @param {string} message_type 消息类型，支持 private、group
     * @param {number|string} id 目标ID，如果是private则是user_id，如果是group则是group_id
     * @param {string|array} message 要发送的内容
     * @param {boolean} auto_escape 消息内容是否作为纯文本发送
     * @returns {Promise<object>} 返回结果，包含message_id
     */
    async sendMsg(message_type, id, message, auto_escape = false) {
        const params = {
            message_type,
            message,
            auto_escape
        };
        
        if (message_type === 'private') {
            params.user_id = Number(id) || id;
        } else if (message_type === 'group') {
            params.group_id = Number(id) || id;
        } else {
            throw new Error(`不支持的消息类型: ${message_type}`);
        }
        
        try {
            const result = await this.client.callApi('send_msg', params);
            return result;
        } catch (error) {
            console.error('[MessageApi] 发送消息失败', error);
            throw error;
        }
    }

    /**
     * 撤回消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async deleteMsg(message_id) {
        try {
            return await this.client.callApi('delete_msg', { message_id: Number(message_id) || message_id });
        } catch (error) {
            console.error('[MessageApi] 撤回消息失败', error);
            throw error;
        }
    }

    /**
     * 获取消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async getMsg(message_id) {
        try {
            return await this.client.callApi('get_msg', { message_id: Number(message_id) || message_id });
        } catch (error) {
            console.error('[MessageApi] 获取消息失败', error);
            throw error;
        }
    }

    /**
     * 获取合并转发消息
     * @param {string} id 合并转发 ID
     * @returns {Promise<object>} 返回结果
     */
    async getForwardMsg(id) {
        try {
            return await this.client.callApi('get_forward_msg', { id });
        } catch (error) {
            console.error('[MessageApi] 获取合并转发消息失败', error);
            throw error;
        }
    }

    /**
     * 发送合并转发(群聊)
     * @param {number|string} group_id 群号
     * @param {array} messages 自定义转发消息，格式是node消息段数组
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupForwardMsg(group_id, messages) {
        try {
            // 验证messages格式
            if (!Array.isArray(messages)) {
                throw new Error('消息必须是数组格式');
            }

            // 确保每个消息都是node类型
            messages = messages.map(msg => {
                if (typeof msg === 'object' && msg.type === 'node') {
                    return msg;
                }
                
                // 尝试转换成node格式
                return {
                    type: 'node',
                    data: typeof msg === 'object' ? msg : { content: msg }
                };
            });
            
            const params = {
                group_id: Number(group_id) || group_id,
                messages
            };
            
            return await this.client.callApi('send_group_forward_msg', params);
        } catch (error) {
            console.error('[MessageApi] 发送群合并转发消息失败', error);
            throw error;
        }
    }

    /**
     * 发送合并转发(私聊)
     * @param {number|string} user_id 好友QQ号
     * @param {array} messages 自定义转发消息，格式是node消息段数组
     * @returns {Promise<object>} 返回结果
     */
    async sendPrivateForwardMsg(user_id, messages) {
        try {
            // 验证messages格式
            if (!Array.isArray(messages)) {
                throw new Error('消息必须是数组格式');
            }

            // 确保每个消息都是node类型
            messages = messages.map(msg => {
                if (typeof msg === 'object' && msg.type === 'node') {
                    return msg;
                }
                
                // 尝试转换成node格式
                return {
                    type: 'node',
                    data: typeof msg === 'object' ? msg : { content: msg }
                };
            });
            
            const params = {
                user_id: Number(user_id) || user_id,
                messages
            };
            
            return await this.client.callApi('send_private_forward_msg', params);
        } catch (error) {
            console.error('[MessageApi] 发送私聊合并转发消息失败', error);
            throw error;
        }
    }

    /**
     * 获取群消息历史记录
     * @param {number|string} group_id 群号
     * @param {number} message_seq 起始消息序号, 可通过 get_msg 获得
     * @returns {Promise<object>} 返回结果
     */
    async getGroupMsgHistory(group_id, message_seq = 0) {
        try {
            return await this.client.callApi('get_group_msg_history', {
                group_id: Number(group_id) || group_id,
                message_seq: Number(message_seq)
            });
        } catch (error) {
            console.error('[MessageApi] 获取群消息历史记录失败', error);
            throw error;
        }
    }

    /**
     * 获取私聊消息历史记录
     * @param {number|string} user_id 用户QQ号
     * @param {number} message_seq 起始消息序号, 可通过 get_msg 获得
     * @returns {Promise<object>} 返回结果
     */
    async getFriendMsgHistory(user_id, message_seq = 0) {
        try {
            return await this.client.callApi('get_friend_msg_history', {
                user_id: Number(user_id) || user_id,
                message_seq: Number(message_seq)
            });
        } catch (error) {
            console.error('[MessageApi] 获取私聊消息历史记录失败', error);
            throw error;
        }
    }

    /**
     * 标记消息已读
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async markMsgAsRead(message_id) {
        try {
            return await this.client.callApi('mark_msg_as_read', { 
                message_id: Number(message_id) || message_id 
            });
        } catch (error) {
            console.error('[MessageApi] 标记消息已读失败', error);
            throw error;
        }
    }

    /**
     * 标记私聊消息已读
     * @param {number|string} user_id 好友 QQ 号
     * @returns {Promise<object>} 返回结果
     */
    async markPrivateMsgAsRead(user_id) {
        try {
            return await this.client.callApi('mark_private_msg_as_read', { 
                user_id: Number(user_id) || user_id 
            });
        } catch (error) {
            console.error('[MessageApi] 标记私聊消息已读失败', error);
            throw error;
        }
    }

    /**
     * 标记群聊消息已读
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async markGroupMsgAsRead(group_id) {
        try {
            return await this.client.callApi('mark_group_msg_as_read', { 
                group_id: Number(group_id) || group_id 
            });
        } catch (error) {
            console.error('[MessageApi] 标记群聊消息已读失败', error);
            throw error;
        }
    }
    
    /**
     * 创建文本消息段
     * @param {string} text 文本内容
     * @returns {object} 消息段对象
     */
    text(text) {
        return {
            type: 'text',
            data: {
                text: String(text)
            }
        };
    }
    
    /**
     * 创建图片消息段
     * @param {string} file 图片文件名或URL地址
     * @param {boolean} cache 是否使用缓存
     * @returns {object} 消息段对象
     */
    image(file, cache = true) {
        return {
            type: 'image',
            data: {
                file,
                cache: cache ? 1 : 0
            }
        };
    }
    
    /**
     * 创建at消息段
     * @param {string} qq 要@的QQ号
     * @returns {object} 消息段对象
     */
    at(qq) {
        return {
            type: 'at',
            data: {
                qq: String(qq)
            }
        };
    }
    
    /**
     * 创建回复消息段
     * @param {string} id 回复的消息ID
     * @returns {object} 消息段对象
     */
    reply(id) {
        return {
            type: 'reply',
            data: {
                id: String(id)
            }
        };
    }
}

module.exports = MessageApi; 