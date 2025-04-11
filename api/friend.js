/**
 * 好友相关API封装
 */
class FriendApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取好友列表
     * @returns {Promise<object>} 返回结果
     */
    async getFriendList() {
        return await this.client.callApi('get_friend_list');
    }

    /**
     * 获取好友分类列表
     * @returns {Promise<object>} 返回结果
     */
    async getFriendsWithCategory() {
        return await this.client.callApi('get_friends_with_category');
    }

    /**
     * 获取陌生人信息
     * @param {number|string} user_id QQ 号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回结果
     */
    async getStrangerInfo(user_id, no_cache = false) {
        return await this.client.callApi('get_stranger_info', {
            user_id,
            no_cache
        });
    }

    /**
     * 发送好友赞
     * @param {number|string} user_id QQ 号
     * @param {number} times 赞的次数
     * @returns {Promise<object>} 返回结果
     */
    async sendLike(user_id, times = 1) {
        return await this.client.callApi('send_like', {
            user_id,
            times
        });
    }

    /**
     * 删除好友
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 返回结果
     */
    async deleteFriend(user_id) {
        return await this.client.callApi('delete_friend', {
            user_id
        });
    }

    /**
     * 处理加好友请求
     * @param {string} flag 加好友请求的 flag（需从上报的数据中获得）
     * @param {boolean} approve 是否同意请求
     * @param {string} remark 添加后的好友备注（仅在同意时有效）
     * @returns {Promise<object>} 返回结果
     */
    async setFriendAddRequest(flag, approve = true, remark = '') {
        return await this.client.callApi('set_friend_add_request', {
            flag,
            approve,
            remark
        });
    }

    /**
     * 获取陌生人在线状态
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 返回结果
     */
    async getUserStatus(user_id) {
        return await this.client.callApi('nc_get_user_status', {
            user_id
        });
    }

    /**
     * 私聊戳一戳
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 返回结果
     */
    async friendPoke(user_id) {
        return await this.client.callApi('friend_poke', {
            user_id
        });
    }

    /**
     * 推荐联系人/群聊
     * @param {number|string} user_id QQ 号
     * @param {number|string} recommend_id 被推荐的联系人/群QQ号
     * @param {string} recommend_type 推荐类型，'contact'联系人，'group'群聊
     * @param {string} reason 推荐理由
     * @returns {Promise<object>} 返回结果
     */
    async arkSharePeer(user_id, recommend_id, recommend_type = 'contact', reason = '') {
        return await this.client.callApi('ArkSharePeer', {
            user_id,
            recommend_id,
            recommend_type,
            reason
        });
    }

    /**
     * 推荐群聊
     * @param {number|string} user_id QQ 号
     * @param {number|string} group_id 推荐的群号
     * @param {string} reason 推荐理由
     * @returns {Promise<object>} 返回结果
     */
    async arkShareGroup(user_id, group_id, reason = '') {
        return await this.client.callApi('ArkShareGroup', {
            user_id,
            group_id,
            reason
        });
    }

    /**
     * 设置输入状态
     * @param {number|string} user_id QQ 号
     * @param {string} typing_state 输入状态，'typing'为正在输入，'cancel'为取消输入
     * @returns {Promise<object>} 返回结果
     */
    async setInputStatus(user_id, typing_state = 'typing') {
        return await this.client.callApi('set_input_status', {
            user_id,
            typing_state
        });
    }

    /**
     * 转发单条信息到私聊
     * @param {number|string} user_id QQ 号
     * @param {number|string} message_id 消息ID
     * @returns {Promise<object>} 返回结果
     */
    async forwardFriendSingleMsg(user_id, message_id) {
        return await this.client.callApi('forward_friend_single_msg', {
            user_id,
            message_id
        });
    }
}

module.exports = FriendApi; 