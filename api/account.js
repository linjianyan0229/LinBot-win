/**
 * 账号相关API封装
 */
class AccountApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取登录号信息
     * @returns {Promise<object>} 返回结果
     */
    async getLoginInfo() {
        return await this.client.callApi('get_login_info');
    }

    /**
     * 获取Cookie
     * @param {string} domain 需要获取 cookie 的域名
     * @returns {Promise<object>} 返回结果
     */
    async getCookies(domain = '') {
        return await this.client.callApi('get_cookies', {
            domain
        });
    }

    /**
     * 获取 CSRF Token
     * @returns {Promise<object>} 返回结果
     */
    async getCsrfToken() {
        return await this.client.callApi('get_csrf_token');
    }

    /**
     * 获取 QQ 相关接口凭证
     * @param {string} domain 需要获取 cookie 的域名
     * @returns {Promise<object>} 返回结果
     */
    async getCredentials(domain = '') {
        return await this.client.callApi('get_credentials', {
            domain
        });
    }

    /**
     * 获取版本信息
     * @returns {Promise<object>} 返回结果
     */
    async getVersionInfo() {
        return await this.client.callApi('get_version_info');
    }

    /**
     * 获取运行状态
     * @returns {Promise<object>} 返回结果
     */
    async getStatus() {
        return await this.client.callApi('get_status');
    }

    /**
     * 设置登录号资料
     * @param {string} nickname 昵称
     * @param {string} company 公司
     * @param {string} email 邮箱
     * @param {string} college 学校
     * @param {string} personal_note 个人说明
     * @returns {Promise<object>} 返回结果
     */
    async setQQProfile(nickname, company = '', email = '', college = '', personal_note = '') {
        return await this.client.callApi('set_qq_profile', {
            nickname,
            company,
            email,
            college,
            personal_note
        });
    }

    /**
     * 设置个人签名
     * @param {string} signature 签名内容
     * @returns {Promise<object>} 返回结果
     */
    async setSelfLongnick(signature) {
        return await this.client.callApi('set_self_longnick', {
            signature
        });
    }

    /**
     * 获取在线机型
     * @param {string} model 机型名称
     * @returns {Promise<object>} 返回结果
     */
    async getModelShow(model = '') {
        return await this.client.callApi('_get_model_show', {
            model
        });
    }

    /**
     * 设置在线机型
     * @param {string} model 机型名称
     * @param {string} model_show 机型名称展示
     * @returns {Promise<object>} 返回结果
     */
    async setModelShow(model, model_show) {
        return await this.client.callApi('_set_model_show', {
            model,
            model_show
        });
    }

    /**
     * 获取当前账号在线客户端列表
     * @param {boolean} no_cache 是否不使用缓存
     * @returns {Promise<object>} 返回结果
     */
    async getOnlineClients(no_cache = false) {
        return await this.client.callApi('get_online_clients', {
            no_cache
        });
    }

    /**
     * 设置在线状态
     * @param {number} status 在线状态，11在线，31离开，41隐身，50忙碌，60Q我，70请勿打扰
     * @returns {Promise<object>} 返回结果
     */
    async setOnlineStatus(status) {
        return await this.client.callApi('set_online_status', {
            status
        });
    }

    /**
     * 获取机器人QQ号区间
     * @returns {Promise<object>} 返回结果
     */
    async getRobotUinRange() {
        return await this.client.callApi('get_robot_uin_range');
    }

    /**
     * 设置头像
     * @param {string} file 图片文件路径
     * @returns {Promise<object>} 返回结果
     */
    async setQQAvatar(file) {
        return await this.client.callApi('set_qq_avatar', {
            file
        });
    }

    /**
     * 获取自身点赞列表
     * @returns {Promise<object>} 返回结果
     */
    async getProfileLike() {
        return await this.client.callApi('get_profile_like');
    }

    /**
     * 清理缓存
     * @returns {Promise<object>} 返回结果
     */
    async cleanCache() {
        return await this.client.callApi('clean_cache');
    }
}

module.exports = AccountApi; 