/**
 * 群组相关API封装
 */
class GroupApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取群列表
     * @returns {Promise<object>} 返回结果
     */
    async getGroupList() {
        return await this.client.callApi('get_group_list');
    }

    /**
     * 获取群信息
     * @param {number|string} group_id 群号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回结果
     */
    async getGroupInfo(group_id, no_cache = false) {
        return await this.client.callApi('get_group_info', {
            group_id,
            no_cache
        });
    }

    /**
     * 获取群成员信息
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回结果
     */
    async getGroupMemberInfo(group_id, user_id, no_cache = false) {
        return await this.client.callApi('get_group_member_info', {
            group_id,
            user_id,
            no_cache
        });
    }

    /**
     * 获取群成员列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async getGroupMemberList(group_id) {
        return await this.client.callApi('get_group_member_list', {
            group_id
        });
    }

    /**
     * 获取群荣誉信息
     * @param {number|string} group_id 群号
     * @param {string} type 要获取的群荣誉类型，可传入 talkative performer legend strong_newbie emotion 以分别获取单个类型的群荣誉数据，或传入 all 获取所有数据
     * @returns {Promise<object>} 返回结果
     */
    async getGroupHonorInfo(group_id, type = 'all') {
        return await this.client.callApi('get_group_honor_info', {
            group_id,
            type
        });
    }

    /**
     * 群组踢人
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} reject_add_request 拒绝此人的加群请求
     * @returns {Promise<object>} 返回结果
     */
    async setGroupKick(group_id, user_id, reject_add_request = false) {
        return await this.client.callApi('set_group_kick', {
            group_id,
            user_id,
            reject_add_request
        });
    }

    /**
     * 群组单人禁言
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {number} duration 禁言时长，单位秒，0 表示取消禁言
     * @returns {Promise<object>} 返回结果
     */
    async setGroupBan(group_id, user_id, duration = 30 * 60) {
        return await this.client.callApi('set_group_ban', {
            group_id,
            user_id,
            duration
        });
    }

    /**
     * 群组全员禁言
     * @param {number|string} group_id 群号
     * @param {boolean} enable 是否禁言
     * @returns {Promise<object>} 返回结果
     */
    async setGroupWholeBan(group_id, enable = true) {
        return await this.client.callApi('set_group_whole_ban', {
            group_id,
            enable
        });
    }

    /**
     * 群组设置管理员
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} enable 是否设置为管理员
     * @returns {Promise<object>} 返回结果
     */
    async setGroupAdmin(group_id, user_id, enable = true) {
        return await this.client.callApi('set_group_admin', {
            group_id,
            user_id,
            enable
        });
    }

    /**
     * 设置群名片（群备注）
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {string} card 群名片内容，不填或空字符串表示删除群名片
     * @returns {Promise<object>} 返回结果
     */
    async setGroupCard(group_id, user_id, card = '') {
        return await this.client.callApi('set_group_card', {
            group_id,
            user_id,
            card
        });
    }

    /**
     * 设置群名
     * @param {number|string} group_id 群号
     * @param {string} group_name 新群名
     * @returns {Promise<object>} 返回结果
     */
    async setGroupName(group_id, group_name) {
        return await this.client.callApi('set_group_name', {
            group_id,
            group_name
        });
    }

    /**
     * 退出群组
     * @param {number|string} group_id 群号
     * @param {boolean} is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
     * @returns {Promise<object>} 返回结果
     */
    async setGroupLeave(group_id, is_dismiss = false) {
        return await this.client.callApi('set_group_leave', {
            group_id,
            is_dismiss
        });
    }

    /**
     * 设置群组专属头衔
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {string} special_title 专属头衔，不填或空字符串表示删除专属头衔
     * @param {number} duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效
     * @returns {Promise<object>} 返回结果
     */
    async setGroupSpecialTitle(group_id, user_id, special_title = '', duration = -1) {
        return await this.client.callApi('set_group_special_title', {
            group_id,
            user_id,
            special_title,
            duration
        });
    }

    /**
     * 处理加群请求／邀请
     * @param {string} flag 加群请求的 flag（需从上报的数据中获得）
     * @param {string} sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
     * @param {boolean} approve 是否同意请求／邀请
     * @param {string} reason 拒绝理由（仅在拒绝时有效）
     * @returns {Promise<object>} 返回结果
     */
    async setGroupAddRequest(flag, sub_type, approve = true, reason = '') {
        return await this.client.callApi('set_group_add_request', {
            flag,
            sub_type,
            approve,
            reason
        });
    }

    /**
     * 获取群系统消息
     * @returns {Promise<object>} 返回结果
     */
    async getGroupSystemMsg() {
        return await this.client.callApi('get_group_system_msg');
    }

    /**
     * 获取精华消息列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async getEssenceMsgList(group_id) {
        return await this.client.callApi('get_essence_msg_list', {
            group_id
        });
    }

    /**
     * 设置精华消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async setEssenceMsg(message_id) {
        return await this.client.callApi('set_essence_msg', {
            message_id
        });
    }

    /**
     * 移出精华消息
     * @param {number|string} message_id 消息 ID
     * @returns {Promise<object>} 返回结果
     */
    async deleteEssenceMsg(message_id) {
        return await this.client.callApi('delete_essence_msg', {
            message_id
        });
    }

    /**
     * 群打卡
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupSign(group_id) {
        return await this.client.callApi('send_group_sign', {
            group_id
        });
    }

    /**
     * 发送群公告
     * @param {number|string} group_id 群号
     * @param {string} content 公告内容
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupNotice(group_id, content) {
        return await this.client.callApi('_send_group_notice', {
            group_id,
            content
        });
    }

    /**
     * 获取群公告
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async getGroupNotice(group_id) {
        return await this.client.callApi('_get_group_notice', {
            group_id
        });
    }

    /**
     * 删除群公告
     * @param {number|string} group_id 群号
     * @param {string} notice_id 公告 ID
     * @returns {Promise<object>} 返回结果
     */
    async deleteGroupNotice(group_id, notice_id) {
        return await this.client.callApi('_del_group_notice', {
            group_id,
            notice_id
        });
    }
}

module.exports = GroupApi; 