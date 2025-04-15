/**
 * 账号相关API封装
 * 基于OneBot v11标准实现
 * 参考：https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 */
class AccountApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取登录号信息
     * @returns {Promise<object>} 登录号信息
     */
    async getLoginInfo() {
        try {
            console.log('[AccountApi] 获取登录号信息');
            return await this.client.callApi('get_login_info');
        } catch (error) {
            console.error('[AccountApi] 获取登录号信息失败', error);
            throw error;
        }
    }

    /**
     * 获取Cookie
     * @param {string} domain 需要获取 cookie 的域名
     * @returns {Promise<object>} Cookies
     */
    async getCookies(domain = '') {
        try {
            console.log(`[AccountApi] 获取Cookies: ${domain || '所有域名'}`);
            return await this.client.callApi('get_cookies', {
                domain
            });
        } catch (error) {
            console.error('[AccountApi] 获取Cookies失败', error);
            throw error;
        }
    }

    /**
     * 获取 CSRF Token
     * @returns {Promise<object>} CSRF Token
     */
    async getCsrfToken() {
        try {
            console.log('[AccountApi] 获取CSRF Token');
            return await this.client.callApi('get_csrf_token');
        } catch (error) {
            console.error('[AccountApi] 获取CSRF Token失败', error);
            throw error;
        }
    }

    /**
     * 获取 QQ 相关接口凭证
     * @param {string} domain 需要获取 cookie 的域名
     * @returns {Promise<object>} QQ相关接口凭证
     */
    async getCredentials(domain = '') {
        try {
            console.log(`[AccountApi] 获取QQ相关接口凭证: ${domain || '所有域名'}`);
            return await this.client.callApi('get_credentials', {
                domain
            });
        } catch (error) {
            console.error('[AccountApi] 获取QQ相关接口凭证失败', error);
            throw error;
        }
    }

    /**
     * 获取版本信息
     * @returns {Promise<object>} 应用及 OneBot 的版本信息
     */
    async getVersionInfo() {
        try {
            console.log('[AccountApi] 获取版本信息');
            return await this.client.callApi('get_version_info');
        } catch (error) {
            console.error('[AccountApi] 获取版本信息失败', error);
            throw error;
        }
    }

    /**
     * 获取运行状态
     * @returns {Promise<object>} 运行状态
     */
    async getStatus() {
        try {
            console.log('[AccountApi] 获取运行状态');
            return await this.client.callApi('get_status');
        } catch (error) {
            console.error('[AccountApi] 获取运行状态失败', error);
            throw error;
        }
    }

    /**
     * 设置登录号资料
     * @param {string} nickname 昵称
     * @param {string} company 公司
     * @param {string} email 邮箱
     * @param {string} college 学校
     * @param {string} personal_note 个人说明
     * @returns {Promise<object>} 操作结果
     */
    async setQQProfile(nickname, company = '', email = '', college = '', personal_note = '') {
        try {
            console.log(`[AccountApi] 设置登录号资料: ${nickname}`);
            return await this.client.callApi('set_qq_profile', {
                nickname,
                company,
                email,
                college,
                personal_note
            });
        } catch (error) {
            console.error('[AccountApi] 设置登录号资料失败', error);
            throw error;
        }
    }

    /**
     * 获取陌生人信息
     * @param {number|string} user_id QQ号
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 陌生人信息
     */
    async getStrangerInfo(user_id, no_cache = false) {
        try {
            console.log(`[AccountApi] 获取陌生人信息: ${user_id}`);
            return await this.client.callApi('get_stranger_info', {
                user_id: Number(user_id) || user_id,
                no_cache
            });
        } catch (error) {
            console.error('[AccountApi] 获取陌生人信息失败', error);
            throw error;
        }
    }

    /**
     * 获取好友列表
     * @returns {Promise<object>} 好友列表
     */
    async getFriendList() {
        try {
            console.log('[AccountApi] 获取好友列表');
            return await this.client.callApi('get_friend_list');
        } catch (error) {
            console.error('[AccountApi] 获取好友列表失败', error);
            throw error;
        }
    }

    /**
     * 设置个人签名
     * @param {string} signature 签名内容
     * @returns {Promise<object>} 操作结果
     */
    async setSelfLongnick(signature) {
        try {
            console.log(`[AccountApi] 设置个人签名: ${signature.substring(0, 20)}${signature.length > 20 ? '...' : ''}`);
            return await this.client.callApi('set_self_longnick', {
                signature
            });
        } catch (error) {
            console.error('[AccountApi] 设置个人签名失败', error);
            throw error;
        }
    }

    /**
     * 获取在线机型
     * @param {string} model 机型名称
     * @returns {Promise<object>} 在线机型信息
     */
    async getModelShow(model = '') {
        try {
            console.log(`[AccountApi] 获取在线机型: ${model || '默认'}`);
            return await this.client.callApi('_get_model_show', {
                model
            });
        } catch (error) {
            console.error('[AccountApi] 获取在线机型失败', error);
            throw error;
        }
    }

    /**
     * 设置在线机型
     * @param {string} model 机型名称
     * @param {string} model_show 机型名称展示
     * @returns {Promise<object>} 操作结果
     */
    async setModelShow(model, model_show) {
        try {
            console.log(`[AccountApi] 设置在线机型: ${model} => ${model_show}`);
            return await this.client.callApi('_set_model_show', {
                model,
                model_show
            });
        } catch (error) {
            console.error('[AccountApi] 设置在线机型失败', error);
            throw error;
        }
    }

    /**
     * 获取当前账号在线客户端列表
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 在线客户端列表
     */
    async getOnlineClients(no_cache = false) {
        try {
            console.log('[AccountApi] 获取在线客户端列表');
            return await this.client.callApi('get_online_clients', {
                no_cache
            });
        } catch (error) {
            console.error('[AccountApi] 获取在线客户端列表失败', error);
            throw error;
        }
    }

    /**
     * 设置在线状态
     * @param {number} status 在线状态，11在线，31离开，41隐身，50忙碌，60Q我，70请勿打扰
     * @returns {Promise<object>} 操作结果
     */
    async setOnlineStatus(status) {
        try {
            if (typeof status !== 'number') {
                status = Number(status);
            }
            
            console.log(`[AccountApi] 设置在线状态: ${status}`);
            return await this.client.callApi('set_online_status', {
                status
            });
        } catch (error) {
            console.error('[AccountApi] 设置在线状态失败', error);
            throw error;
        }
    }

    /**
     * 获取机器人QQ号区间
     * @returns {Promise<object>} QQ号区间
     */
    async getRobotUinRange() {
        try {
            console.log('[AccountApi] 获取机器人QQ号区间');
            return await this.client.callApi('get_robot_uin_range');
        } catch (error) {
            console.error('[AccountApi] 获取机器人QQ号区间失败', error);
            throw error;
        }
    }

    /**
     * 设置头像
     * @param {string} file 图片文件路径
     * @returns {Promise<object>} 操作结果
     */
    async setQQAvatar(file) {
        try {
            if (!file) {
                throw new Error('头像文件路径不能为空');
            }
            
            console.log(`[AccountApi] 设置头像: ${file}`);
            return await this.client.callApi('set_qq_avatar', {
                file
            });
        } catch (error) {
            console.error('[AccountApi] 设置头像失败', error);
            throw error;
        }
    }

    /**
     * 发送好友赞
     * @param {number|string} user_id QQ号
     * @param {number} times 赞的次数，每个好友每天最多10次
     * @returns {Promise<object>} 操作结果
     */
    async sendLike(user_id, times = 1) {
        try {
            const actual_times = Math.min(10, Math.max(1, Number(times) || 1));
            console.log(`[AccountApi] 发送好友赞: ${user_id}, 次数: ${actual_times}`);
            
            return await this.client.callApi('send_like', {
                user_id: Number(user_id) || user_id,
                times: actual_times
            });
        } catch (error) {
            console.error('[AccountApi] 发送好友赞失败', error);
            throw error;
        }
    }

    /**
     * 获取自身点赞列表
     * @returns {Promise<object>} 点赞列表
     */
    async getProfileLike() {
        try {
            console.log('[AccountApi] 获取自身点赞列表');
            return await this.client.callApi('get_profile_like');
        } catch (error) {
            console.error('[AccountApi] 获取自身点赞列表失败', error);
            throw error;
        }
    }

    /**
     * 重启 OneBot 实现
     * @param {number} delay 要延迟的毫秒数，如果默认情况下无法重启，可以尝试设置延迟
     * @returns {Promise<object>} 操作结果
     */
    async setRestart(delay = 0) {
        try {
            console.log(`[AccountApi] 重启 OneBot，延迟: ${delay}ms`);
            return await this.client.callApi('set_restart', {
                delay: Number(delay) || 0
            });
        } catch (error) {
            console.error('[AccountApi] 重启 OneBot 失败', error);
            throw error;
        }
    }

    /**
     * 清理缓存
     * @returns {Promise<object>} 操作结果
     */
    async cleanCache() {
        try {
            console.log('[AccountApi] 清理缓存');
            return await this.client.callApi('clean_cache');
        } catch (error) {
            console.error('[AccountApi] 清理缓存失败', error);
            throw error;
        }
    }
}

module.exports = AccountApi; 