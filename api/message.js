/**
 * 消息相关API封装
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
     * @returns {Promise<object>} 返回结果
     */
    async sendPrivateMsg(user_id, message, auto_escape = false) {
        return await this.client.callApi('send_private_msg', {
            user_id,
            message,
            auto_escape
        });
    }

    /**
     * 发送群消息
     * @param {number|string} group_id 群号
     * @param {string|array} message 要发送的内容
     * @param {boolean} auto_escape 消息内容是否作为纯文本发送
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupMsg(group_id, message, auto_escape = false) {
        return await this.client.callApi('send_group_msg', {
            group_id,
            message,
            auto_escape
        });
    }

    /**
     * 发送消息
     * @param {string} message_type 消息类型，支持 private、group
     * @param {number|string} id 目标ID，如果是private则是user_id，如果是group则是group_id
     * @param {string|array} message 要发送的内容
     * @param {boolean} auto_escape 消息内容是否作为纯文本发送
     * @returns {Promise<object>} 返回结果
     */
    async sendMsg(message_type, id, message, auto_escape = false) {
        const params = {
            message_type,
            message,
            auto_escape
        };
        
        if (message_type === 'private') {
            params.user_id = id;
        } else if (message_type === 'group') {
            params.group_id = id;
        }
        
        return await this.client.callApi('send_msg', params);
    }

    /**
     * 撤回消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async deleteMsg(message_id) {
        return await this.client.callApi('delete_msg', { message_id });
    }

    /**
     * 获取消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async getMsg(message_id) {
        return await this.client.callApi('get_msg', { message_id });
    }

    /**
     * 获取合并转发消息
     * @param {string} id 合并转发 ID
     * @returns {Promise<object>} 返回结果
     */
    async getForwardMsg(id) {
        return await this.client.callApi('get_forward_msg', { id });
    }

    /**
     * 发送合并转发(群聊)
     * @param {number|string} group_id 群号
     * @param {array} messages 自定义转发消息
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupForwardMsg(group_id, messages) {
        return await this.client.callApi('send_group_forward_msg', {
            group_id,
            messages
        });
    }

    /**
     * 发送合并转发(私聊)
     * @param {number|string} user_id 好友QQ号
     * @param {array} messages 自定义转发消息
     * @returns {Promise<object>} 返回结果
     */
    async sendPrivateForwardMsg(user_id, messages) {
        return await this.client.callApi('send_private_forward_msg', {
            user_id,
            messages
        });
    }

    /**
     * 获取群消息历史记录
     * @param {number|string} group_id 群号
     * @param {number} message_seq 起始消息序号, 可通过 get_msg 获得
     * @returns {Promise<object>} 返回结果
     */
    async getGroupMsgHistory(group_id, message_seq = 0) {
        return await this.client.callApi('get_group_msg_history', {
            group_id,
            message_seq
        });
    }

    /**
     * 获取私聊消息历史记录
     * @param {number|string} user_id 用户QQ号
     * @param {number} message_seq 起始消息序号, 可通过 get_msg 获得
     * @returns {Promise<object>} 返回结果
     */
    async getFriendMsgHistory(user_id, message_seq = 0) {
        return await this.client.callApi('get_friend_msg_history', {
            user_id,
            message_seq
        });
    }

    /**
     * 标记消息已读
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async markMsgAsRead(message_id) {
        return await this.client.callApi('mark_msg_as_read', { message_id });
    }

    /**
     * 标记私聊消息已读
     * @param {number|string} user_id 好友 QQ 号
     * @returns {Promise<object>} 返回结果
     */
    async markPrivateMsgAsRead(user_id) {
        return await this.client.callApi('mark_private_msg_as_read', { user_id });
    }

    /**
     * 标记群聊消息已读
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async markGroupMsgAsRead(group_id) {
        return await this.client.callApi('mark_group_msg_as_read', { group_id });
    }
}

module.exports = MessageApi; 