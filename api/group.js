/**
 * 群组相关API封装
 * 基于OneBot v11标准实现
 * 参考：https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 */
class GroupApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取群列表
     * @returns {Promise<object>} 返回群列表数据
     */
    async getGroupList() {
        try {
            console.log('[GroupApi] 获取群列表');
            return await this.client.callApi('get_group_list');
        } catch (error) {
            console.error('[GroupApi] 获取群列表失败', error);
            throw error;
        }
    }

    /**
     * 获取群信息
     * @param {number|string} group_id 群号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回群信息
     */
    async getGroupInfo(group_id, no_cache = false) {
        try {
            console.log(`[GroupApi] 获取群${group_id}信息`);
            return await this.client.callApi('get_group_info', {
                group_id: Number(group_id) || group_id,
                no_cache
            });
        } catch (error) {
            console.error('[GroupApi] 获取群信息失败', error);
            throw error;
        }
    }

    /**
     * 获取群成员信息
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回群成员信息
     */
    async getGroupMemberInfo(group_id, user_id, no_cache = false) {
        try {
            console.log(`[GroupApi] 获取群${group_id}成员${user_id}信息`);
            return await this.client.callApi('get_group_member_info', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                no_cache
            });
        } catch (error) {
            console.error('[GroupApi] 获取群成员信息失败', error);
            throw error;
        }
    }

    /**
     * 获取群成员列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回群成员列表
     */
    async getGroupMemberList(group_id) {
        try {
            console.log(`[GroupApi] 获取群${group_id}成员列表`);
            return await this.client.callApi('get_group_member_list', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[GroupApi] 获取群成员列表失败', error);
            throw error;
        }
    }

    /**
     * 获取群荣誉信息
     * @param {number|string} group_id 群号
     * @param {string} type 要获取的群荣誉类型，可传入 talkative performer legend strong_newbie emotion 以分别获取单个类型的群荣誉数据，或传入 all 获取所有数据
     * @returns {Promise<object>} 返回群荣誉信息
     */
    async getGroupHonorInfo(group_id, type = 'all') {
        try {
            console.log(`[GroupApi] 获取群${group_id}荣誉信息，类型: ${type}`);
            return await this.client.callApi('get_group_honor_info', {
                group_id: Number(group_id) || group_id,
                type
            });
        } catch (error) {
            console.error('[GroupApi] 获取群荣誉信息失败', error);
            throw error;
        }
    }

    /**
     * 群组踢人
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} reject_add_request 拒绝此人的加群请求
     * @returns {Promise<object>} 操作结果
     */
    async setGroupKick(group_id, user_id, reject_add_request = false) {
        try {
            console.log(`[GroupApi] 将${user_id}踢出群${group_id}`);
            return await this.client.callApi('set_group_kick', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                reject_add_request
            });
        } catch (error) {
            console.error('[GroupApi] 群组踢人失败', error);
            throw error;
        }
    }

    /**
     * 群组单人禁言
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {number} duration 禁言时长，单位秒，0 表示取消禁言
     * @returns {Promise<object>} 操作结果
     */
    async setGroupBan(group_id, user_id, duration = 30 * 60) {
        try {
            console.log(`[GroupApi] 设置群${group_id}成员${user_id}禁言${duration}秒`);
            return await this.client.callApi('set_group_ban', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                duration: Number(duration)
            });
        } catch (error) {
            console.error('[GroupApi] 群组禁言失败', error);
            throw error;
        }
    }

    /**
     * 群组全员禁言
     * @param {number|string} group_id 群号
     * @param {boolean} enable 是否禁言
     * @returns {Promise<object>} 操作结果
     */
    async setGroupWholeBan(group_id, enable = true) {
        try {
            console.log(`[GroupApi] 设置群${group_id}全员禁言: ${enable}`);
            return await this.client.callApi('set_group_whole_ban', {
                group_id: Number(group_id) || group_id,
                enable
            });
        } catch (error) {
            console.error('[GroupApi] 群组全员禁言设置失败', error);
            throw error;
        }
    }

    /**
     * 群组设置管理员
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {boolean} enable 是否设置为管理员
     * @returns {Promise<object>} 操作结果
     */
    async setGroupAdmin(group_id, user_id, enable = true) {
        try {
            console.log(`[GroupApi] 设置群${group_id}成员${user_id}为管理员: ${enable}`);
            return await this.client.callApi('set_group_admin', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                enable
            });
        } catch (error) {
            console.error('[GroupApi] 设置群管理员失败', error);
            throw error;
        }
    }

    /**
     * 设置群名片（群备注）
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {string} card 群名片内容，不填或空字符串表示删除群名片
     * @returns {Promise<object>} 操作结果
     */
    async setGroupCard(group_id, user_id, card = '') {
        try {
            console.log(`[GroupApi] 设置群${group_id}成员${user_id}的群名片: ${card}`);
            return await this.client.callApi('set_group_card', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                card
            });
        } catch (error) {
            console.error('[GroupApi] 设置群名片失败', error);
            throw error;
        }
    }

    /**
     * 设置群名
     * @param {number|string} group_id 群号
     * @param {string} group_name 新群名
     * @returns {Promise<object>} 操作结果
     */
    async setGroupName(group_id, group_name) {
        try {
            console.log(`[GroupApi] 设置群${group_id}名称: ${group_name}`);
            return await this.client.callApi('set_group_name', {
                group_id: Number(group_id) || group_id,
                group_name
            });
        } catch (error) {
            console.error('[GroupApi] 设置群名失败', error);
            throw error;
        }
    }

    /**
     * 退出群组
     * @param {number|string} group_id 群号
     * @param {boolean} is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
     * @returns {Promise<object>} 操作结果
     */
    async setGroupLeave(group_id, is_dismiss = false) {
        try {
            console.log(`[GroupApi] ${is_dismiss ? '解散' : '退出'}群${group_id}`);
            return await this.client.callApi('set_group_leave', {
                group_id: Number(group_id) || group_id,
                is_dismiss
            });
        } catch (error) {
            console.error('[GroupApi] 退出群组失败', error);
            throw error;
        }
    }

    /**
     * 设置群组专属头衔
     * @param {number|string} group_id 群号
     * @param {number|string} user_id QQ 号
     * @param {string} special_title 专属头衔，不填或空字符串表示删除专属头衔
     * @param {number} duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效
     * @returns {Promise<object>} 操作结果
     */
    async setGroupSpecialTitle(group_id, user_id, special_title = '', duration = -1) {
        try {
            console.log(`[GroupApi] 设置群${group_id}成员${user_id}的专属头衔: ${special_title}`);
            return await this.client.callApi('set_group_special_title', {
                group_id: Number(group_id) || group_id,
                user_id: Number(user_id) || user_id,
                special_title,
                duration: Number(duration)
            });
        } catch (error) {
            console.error('[GroupApi] 设置群专属头衔失败', error);
            throw error;
        }
    }

    /**
     * 处理加群请求／邀请
     * @param {string} flag 加群请求的 flag（需从上报的数据中获得）
     * @param {string} sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
     * @param {boolean} approve 是否同意请求／邀请
     * @param {string} reason 拒绝理由（仅在拒绝时有效）
     * @returns {Promise<object>} 操作结果
     */
    async setGroupAddRequest(flag, sub_type, approve = true, reason = '') {
        try {
            if (!flag) {
                throw new Error('缺少请求标识flag');
            }
            
            if (sub_type !== 'add' && sub_type !== 'invite') {
                throw new Error('子类型必须是add或invite');
            }
            
            console.log(`[GroupApi] 处理加群请求: ${sub_type}, 是否同意: ${approve}`);
            return await this.client.callApi('set_group_add_request', {
                flag,
                sub_type,
                approve,
                reason: !approve ? reason : ''
            });
        } catch (error) {
            console.error('[GroupApi] 处理加群请求失败', error);
            throw error;
        }
    }

    /**
     * 获取群系统消息
     * @returns {Promise<object>} 返回群系统消息
     */
    async getGroupSystemMsg() {
        try {
            console.log('[GroupApi] 获取群系统消息');
            return await this.client.callApi('get_group_system_msg');
        } catch (error) {
            console.error('[GroupApi] 获取群系统消息失败', error);
            throw error;
        }
    }

    /**
     * 获取群精华消息列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回群精华消息列表
     */
    async getEssenceMsgList(group_id) {
        try {
            console.log(`[GroupApi] 获取群${group_id}精华消息列表`);
            return await this.client.callApi('get_essence_msg_list', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[GroupApi] 获取群精华消息列表失败', error);
            throw error;
        }
    }

    /**
     * 设置精华消息
     * @param {number|string} message_id 消息ID
     * @returns {Promise<object>} 操作结果
     */
    async setEssenceMsg(message_id) {
        try {
            console.log(`[GroupApi] 设置精华消息: ${message_id}`);
            return await this.client.callApi('set_essence_msg', {
                message_id: Number(message_id) || message_id
            });
        } catch (error) {
            console.error('[GroupApi] 设置精华消息失败', error);
            throw error;
        }
    }

    /**
     * 删除精华消息
     * @param {number|string} message_id 消息ID
     * @returns {Promise<object>} 操作结果
     */
    async deleteEssenceMsg(message_id) {
        try {
            console.log(`[GroupApi] 删除精华消息: ${message_id}`);
            return await this.client.callApi('delete_essence_msg', {
                message_id: Number(message_id) || message_id
            });
        } catch (error) {
            console.error('[GroupApi] 删除精华消息失败', error);
            throw error;
        }
    }

    /**
     * 发送群打卡
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 操作结果
     */
    async sendGroupSign(group_id) {
        try {
            console.log(`[GroupApi] 发送群${group_id}打卡`);
            return await this.client.callApi('send_group_sign', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[GroupApi] 发送群打卡失败', error);
            throw error;
        }
    }

    /**
     * 发送群公告
     * @param {number|string} group_id 群号
     * @param {string} content 公告内容
     * @returns {Promise<object>} 操作结果
     */
    async sendGroupNotice(group_id, content) {
        try {
            if (!content) {
                throw new Error('公告内容不能为空');
            }
            
            console.log(`[GroupApi] 发送群${group_id}公告`);
            return await this.client.callApi('_send_group_notice', {
                group_id: Number(group_id) || group_id,
                content
            });
        } catch (error) {
            console.error('[GroupApi] 发送群公告失败', error);
            throw error;
        }
    }

    /**
     * 获取群公告
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回群公告列表
     */
    async getGroupNotice(group_id) {
        try {
            console.log(`[GroupApi] 获取群${group_id}公告`);
            return await this.client.callApi('_get_group_notice', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[GroupApi] 获取群公告失败', error);
            throw error;
        }
    }

    /**
     * 删除群公告
     * @param {number|string} group_id 群号
     * @param {string} notice_id 公告ID
     * @returns {Promise<object>} 操作结果
     */
    async deleteGroupNotice(group_id, notice_id) {
        try {
            if (!notice_id) {
                throw new Error('公告ID不能为空');
            }
            
            console.log(`[GroupApi] 删除群${group_id}公告: ${notice_id}`);
            return await this.client.callApi('_del_group_notice', {
                group_id: Number(group_id) || group_id,
                notice_id
            });
        } catch (error) {
            console.error('[GroupApi] 删除群公告失败', error);
            throw error;
        }
    }
}

module.exports = GroupApi; 