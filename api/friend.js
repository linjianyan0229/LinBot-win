/**
 * 好友相关API封装
 * 基于OneBot v11标准实现
 * 参考：https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 */
class FriendApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取好友列表
     * @returns {Promise<object>} 好友列表
     */
    async getFriendList() {
        try {
            console.log('[FriendApi] 获取好友列表');
            return await this.client.callApi('get_friend_list');
        } catch (error) {
            console.error('[FriendApi] 获取好友列表失败', error);
            throw error;
        }
    }

    /**
     * 获取单向好友列表
     * @returns {Promise<object>} 单向好友列表
     */
    async getUnidirectionalFriendList() {
        try {
            console.log('[FriendApi] 获取单向好友列表');
            return await this.client.callApi('get_unidirectional_friend_list');
        } catch (error) {
            console.error('[FriendApi] 获取单向好友列表失败', error);
            throw error;
        }
    }

    /**
     * 获取陌生人信息
     * @param {number|string} user_id QQ 号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 陌生人信息
     */
    async getStrangerInfo(user_id, no_cache = false) {
        try {
            console.log(`[FriendApi] 获取陌生人${user_id}信息`);
            return await this.client.callApi('get_stranger_info', {
                user_id: Number(user_id) || user_id,
                no_cache
            });
        } catch (error) {
            console.error('[FriendApi] 获取陌生人信息失败', error);
            throw error;
        }
    }

    /**
     * 获取好友资料
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 好友资料
     */
    async getFriendInfo(user_id) {
        try {
            console.log(`[FriendApi] 获取好友${user_id}资料`);
            return await this.client.callApi('_get_friend_info', {
                user_id: Number(user_id) || user_id
            });
        } catch (error) {
            console.error('[FriendApi] 获取好友资料失败', error);
            throw error;
        }
    }

    /**
     * 删除好友
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 操作结果
     */
    async deleteFriend(user_id) {
        try {
            console.log(`[FriendApi] 删除好友${user_id}`);
            return await this.client.callApi('delete_friend', {
                user_id: Number(user_id) || user_id
            });
        } catch (error) {
            console.error('[FriendApi] 删除好友失败', error);
            throw error;
        }
    }

    /**
     * 删除单向好友
     * @param {number|string} user_id QQ 号
     * @returns {Promise<object>} 操作结果
     */
    async deleteUnidirectionalFriend(user_id) {
        try {
            console.log(`[FriendApi] 删除单向好友${user_id}`);
            return await this.client.callApi('delete_unidirectional_friend', {
                user_id: Number(user_id) || user_id
            });
        } catch (error) {
            console.error('[FriendApi] 删除单向好友失败', error);
            throw error;
        }
    }

    /**
     * 处理好友请求
     * @param {string} flag 加好友请求的 flag（需从上报的数据中获得）
     * @param {boolean} approve 是否同意请求
     * @param {string} remark 添加后的好友备注（仅在同意时有效）
     * @returns {Promise<object>} 操作结果
     */
    async setFriendAddRequest(flag, approve = true, remark = '') {
        try {
            if (!flag) {
                throw new Error('缺少请求标识flag');
            }
            
            console.log(`[FriendApi] 处理好友请求，是否同意: ${approve}`);
            return await this.client.callApi('set_friend_add_request', {
                flag,
                approve,
                remark: approve ? remark : ''
            });
        } catch (error) {
            console.error('[FriendApi] 处理好友请求失败', error);
            throw error;
        }
    }

    /**
     * 发送好友赞
     * @param {number|string} user_id QQ 号
     * @param {number} times 赞的次数
     * @returns {Promise<object>} 操作结果
     */
    async sendLike(user_id, times = 1) {
        try {
            // 每个好友每天最多 10 次
            const actualTimes = Math.min(Math.max(1, Number(times) || 1), 10);
            
            console.log(`[FriendApi] 给好友${user_id}点赞${actualTimes}次`);
            return await this.client.callApi('send_like', {
                user_id: Number(user_id) || user_id,
                times: actualTimes
            });
        } catch (error) {
            console.error('[FriendApi] 发送好友赞失败', error);
            throw error;
        }
    }

    /**
     * 添加好友
     * @param {number|string} user_id QQ 号
     * @param {string} comment 验证信息
     * @param {string} source 来源，可选值 search添加后搜索的人， group添加群聊中的人， card添加名片中的人
     * @returns {Promise<object>} 操作结果
     */
    async addFriend(user_id, comment = '', source = 'search') {
        try {
            console.log(`[FriendApi] 添加好友${user_id}`);
            return await this.client.callApi('add_friend', {
                user_id: Number(user_id) || user_id,
                comment,
                source
            });
        } catch (error) {
            console.error('[FriendApi] 添加好友失败', error);
            throw error;
        }
    }

    /**
     * 设置好友备注
     * @param {number|string} user_id QQ 号
     * @param {string} remark 备注
     * @returns {Promise<object>} 操作结果
     */
    async setFriendRemark(user_id, remark) {
        try {
            console.log(`[FriendApi] 设置好友${user_id}备注: ${remark}`);
            return await this.client.callApi('set_friend_remark', {
                user_id: Number(user_id) || user_id,
                remark
            });
        } catch (error) {
            console.error('[FriendApi] 设置好友备注失败', error);
            throw error;
        }
    }

    /**
     * 获取好友系统消息
     * @returns {Promise<object>} 好友系统消息
     */
    async getFriendSystemMsg() {
        try {
            console.log('[FriendApi] 获取好友系统消息');
            return await this.client.callApi('get_friend_system_msg');
        } catch (error) {
            console.error('[FriendApi] 获取好友系统消息失败', error);
            throw error;
        }
    }
}

module.exports = FriendApi; 