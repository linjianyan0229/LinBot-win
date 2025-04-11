/**
 * 多媒体和文件相关API封装
 */
class MediaApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取图片
     * @param {string} file 图片缓存文件名
     * @returns {Promise<object>} 返回结果
     */
    async getImage(file) {
        return await this.client.callApi('get_image', {
            file
        });
    }

    /**
     * 获取语音
     * @param {string} file 语音文件名
     * @param {string} out_format 输出格式，默认原格式，可选 mp3、amr、wma、m4a、spx、ogg、wav、flac
     * @returns {Promise<object>} 返回结果
     */
    async getRecord(file, out_format = '') {
        return await this.client.callApi('get_record', {
            file,
            out_format
        });
    }

    /**
     * 检查是否可以发送图片
     * @returns {Promise<object>} 返回结果
     */
    async canSendImage() {
        return await this.client.callApi('can_send_image');
    }

    /**
     * 检查是否可以发送语音
     * @returns {Promise<object>} 返回结果
     */
    async canSendRecord() {
        return await this.client.callApi('can_send_record');
    }

    /**
     * 获取文件信息
     * @param {string} file 文件缓存名
     * @returns {Promise<object>} 返回结果
     */
    async getFile(file) {
        return await this.client.callApi('get_file', {
            file
        });
    }

    /**
     * 上传群文件
     * @param {number|string} group_id 群号
     * @param {string} file 本地文件路径
     * @param {string} name 储存名称
     * @param {string} folder 父目录ID
     * @returns {Promise<object>} 返回结果
     */
    async uploadGroupFile(group_id, file, name, folder = '') {
        return await this.client.callApi('upload_group_file', {
            group_id,
            file,
            name,
            folder
        });
    }

    /**
     * 删除群文件
     * @param {number|string} group_id 群号
     * @param {string} file_id 文件ID
     * @param {string} busid 文件类型
     * @returns {Promise<object>} 返回结果
     */
    async deleteGroupFile(group_id, file_id, busid) {
        return await this.client.callApi('delete_group_file', {
            group_id,
            file_id,
            busid
        });
    }

    /**
     * 创建群文件文件夹
     * @param {number|string} group_id 群号
     * @param {string} name 文件夹名称
     * @param {string} parent_id 父目录ID
     * @returns {Promise<object>} 返回结果
     */
    async createGroupFileFolder(group_id, name, parent_id = '') {
        return await this.client.callApi('create_group_file_folder', {
            group_id,
            name,
            parent_id
        });
    }

    /**
     * 删除群文件文件夹
     * @param {number|string} group_id 群号
     * @param {string} folder_id 文件夹ID
     * @returns {Promise<object>} 返回结果
     */
    async deleteGroupFolder(group_id, folder_id) {
        return await this.client.callApi('delete_group_folder', {
            group_id,
            folder_id
        });
    }

    /**
     * 获取群文件系统信息
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async getGroupFileSystemInfo(group_id) {
        return await this.client.callApi('get_group_file_system_info', {
            group_id
        });
    }

    /**
     * 获取群根目录文件列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 返回结果
     */
    async getGroupRootFiles(group_id) {
        return await this.client.callApi('get_group_root_files', {
            group_id
        });
    }

    /**
     * 获取群子目录文件列表
     * @param {number|string} group_id 群号
     * @param {string} folder_id 文件夹ID
     * @returns {Promise<object>} 返回结果
     */
    async getGroupFilesByFolder(group_id, folder_id) {
        return await this.client.callApi('get_group_files_by_folder', {
            group_id,
            folder_id
        });
    }

    /**
     * 获取群文件资源链接
     * @param {number|string} group_id 群号
     * @param {string} file_id 文件ID
     * @param {string} busid 文件类型
     * @returns {Promise<object>} 返回结果
     */
    async getGroupFileUrl(group_id, file_id, busid) {
        return await this.client.callApi('get_group_file_url', {
            group_id,
            file_id,
            busid
        });
    }

    /**
     * 上传私聊文件
     * @param {number|string} user_id QQ号
     * @param {string} file 本地文件路径
     * @param {string} name 文件名称
     * @returns {Promise<object>} 返回结果
     */
    async uploadPrivateFile(user_id, file, name) {
        return await this.client.callApi('upload_private_file', {
            user_id,
            file,
            name
        });
    }

    /**
     * 下载文件到缓存目录
     * @param {string} url 链接地址
     * @param {number} thread_count 下载线程数
     * @param {object} headers 请求头
     * @returns {Promise<object>} 返回结果
     */
    async downloadFile(url, thread_count = 1, headers = {}) {
        return await this.client.callApi('download_file', {
            url,
            thread_count,
            headers
        });
    }

    /**
     * 检查链接安全性
     * @param {string} url 需要检查的链接
     * @returns {Promise<object>} 返回结果
     */
    async checkUrlSafely(url) {
        return await this.client.callApi('check_url_safely', {
            url
        });
    }

    /**
     * 获取收藏表情
     * @returns {Promise<object>} 返回结果
     */
    async fetchCustomFace() {
        return await this.client.callApi('fetch_custom_face');
    }

    /**
     * AI文字转语音
     * @param {string} text 要转换的文本
     * @param {number} speaker 语音角色ID
     * @returns {Promise<object>} 返回结果
     */
    async getAiRecord(text, speaker = 0) {
        return await this.client.callApi('get_ai_record', {
            text,
            speaker
        });
    }

    /**
     * 获取AI语音角色列表
     * @returns {Promise<object>} 返回结果
     */
    async getAiCharacters() {
        return await this.client.callApi('get_ai_characters');
    }

    /**
     * 群聊发送AI语音
     * @param {number|string} group_id 群号
     * @param {string} text 要转换的文本
     * @param {number} speaker 语音角色ID
     * @returns {Promise<object>} 返回结果
     */
    async sendGroupAiRecord(group_id, text, speaker = 0) {
        return await this.client.callApi('send_group_ai_record', {
            group_id,
            text,
            speaker
        });
    }

    /**
     * 图片OCR
     * @param {string} image 图片ID
     * @returns {Promise<object>} 返回结果
     */
    async ocrImage(image) {
        return await this.client.callApi('ocr_image', {
            image
        });
    }

    /**
     * 获取小程序卡片内容
     * @param {string} app_id 小程序ID
     * @param {string} view 视图类型
     * @param {object} params 小程序参数
     * @returns {Promise<object>} 返回结果
     */
    async getMiniAppArk(app_id, view, params = {}) {
        return await this.client.callApi('get_mini_app_ark', {
            app_id,
            view,
            params
        });
    }
}

module.exports = MediaApi; 