/**
 * 多媒体相关API封装
 * 基于OneBot v11标准实现
 * 参考：https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 */
class MediaApi {
    constructor(client) {
        this.client = client;
    }

    /**
     * 获取图片信息
     * @param {string} file 图片缓存文件名或URL
     * @returns {Promise<object>} 图片信息
     */
    async getImage(file) {
        try {
            console.log('[MediaApi] 获取图片信息', file);
            const response = await this.client.callApi('get_image', { file });
            return response;
        } catch (error) {
            console.error('[MediaApi] 获取图片信息失败', error);
            throw error;
        }
    }

    /**
     * 获取语音
     * @param {string} file 语音文件名或URL
     * @param {string} out_format 输出格式，可选 mp3、amr、wma、m4a、spx、ogg、wav、flac
     * @returns {Promise<object>} 语音文件信息
     */
    async getRecord(file, out_format = 'mp3') {
        try {
            console.log('[MediaApi] 获取语音', file, out_format);
            const response = await this.client.callApi('get_record', {
                file,
                out_format
            });
            return response;
        } catch (error) {
            console.error('[MediaApi] 获取语音失败', error);
            throw error;
        }
    }

    /**
     * 检查是否可以发送图片
     * @returns {Promise<boolean>} 是否可以发送图片
     */
    async canSendImage() {
        try {
            console.log('[MediaApi] 检查是否可以发送图片');
            const response = await this.client.callApi('can_send_image');
            return response?.data?.yes === true;
        } catch (error) {
            console.error('[MediaApi] 检查发送图片能力失败', error);
            return false;
        }
    }

    /**
     * 检查是否可以发送语音
     * @returns {Promise<boolean>} 是否可以发送语音
     */
    async canSendRecord() {
        try {
            console.log('[MediaApi] 检查是否可以发送语音');
            const response = await this.client.callApi('can_send_record');
            return response?.data?.yes === true;
        } catch (error) {
            console.error('[MediaApi] 检查发送语音能力失败', error);
            return false;
        }
    }

    /**
     * 获取群文件系统信息
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 文件系统信息
     */
    async getGroupFileSystemInfo(group_id) {
        try {
            console.log('[MediaApi] 获取群文件系统信息', group_id);
            return await this.client.callApi('get_group_file_system_info', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[MediaApi] 获取群文件系统信息失败', error);
            throw error;
        }
    }

    /**
     * 获取群根目录文件列表
     * @param {number|string} group_id 群号
     * @returns {Promise<object>} 文件列表
     */
    async getGroupRootFiles(group_id) {
        try {
            console.log('[MediaApi] 获取群根目录文件列表', group_id);
            return await this.client.callApi('get_group_root_files', {
                group_id: Number(group_id) || group_id
            });
        } catch (error) {
            console.error('[MediaApi] 获取群根目录文件列表失败', error);
            throw error;
        }
    }

    /**
     * 获取群子目录文件列表
     * @param {number|string} group_id 群号
     * @param {string} folder_id 文件夹ID
     * @returns {Promise<object>} 文件列表
     */
    async getGroupFilesByFolder(group_id, folder_id) {
        try {
            console.log('[MediaApi] 获取群子目录文件列表', group_id, folder_id);
            return await this.client.callApi('get_group_files_by_folder', {
                group_id: Number(group_id) || group_id,
                folder_id
            });
        } catch (error) {
            console.error('[MediaApi] 获取群子目录文件列表失败', error);
            throw error;
        }
    }

    /**
     * 获取群文件资源链接
     * @param {number|string} group_id 群号
     * @param {string} file_id 文件ID
     * @param {number} busid 文件类型
     * @returns {Promise<object>} 文件资源链接
     */
    async getGroupFileUrl(group_id, file_id, busid) {
        try {
            console.log('[MediaApi] 获取群文件资源链接', group_id, file_id);
            return await this.client.callApi('get_group_file_url', {
                group_id: Number(group_id) || group_id,
                file_id,
                busid: Number(busid) || 0
            });
        } catch (error) {
            console.error('[MediaApi] 获取群文件资源链接失败', error);
            throw error;
        }
    }

    /**
     * 上传群文件
     * @param {number|string} group_id 群号
     * @param {string} file 本地文件路径
     * @param {string} name 储存名称
     * @param {string} folder 父目录ID
     * @returns {Promise<object>} 上传结果
     */
    async uploadGroupFile(group_id, file, name, folder = '') {
        try {
            console.log('[MediaApi] 上传群文件', group_id, file, name);
            return await this.client.callApi('upload_group_file', {
                group_id: Number(group_id) || group_id,
                file,
                name,
                folder
            });
        } catch (error) {
            console.error('[MediaApi] 上传群文件失败', error);
            throw error;
        }
    }

    /**
     * 获取合并转发内容
     * @param {string} id 合并转发ID
     * @returns {Promise<object>} 合并转发内容
     */
    async getForwardMsg(id) {
        try {
            console.log('[MediaApi] 获取合并转发内容', id);
            return await this.client.callApi('get_forward_msg', { id });
        } catch (error) {
            console.error('[MediaApi] 获取合并转发内容失败', error);
            throw error;
        }
    }

    /**
     * 发送合并转发(群)
     * @param {number|string} group_id 群号
     * @param {Array} messages 消息节点列表
     * @returns {Promise<object>} 发送结果
     */
    async sendGroupForwardMsg(group_id, messages) {
        try {
            console.log('[MediaApi] 发送群合并转发', group_id);
            
            // 确保消息是node格式
            const formattedMessages = this.formatForwardMessages(messages);
            
            return await this.client.callApi('send_group_forward_msg', {
                group_id: Number(group_id) || group_id,
                messages: formattedMessages
            });
        } catch (error) {
            console.error('[MediaApi] 发送群合并转发失败', error);
            throw error;
        }
    }

    /**
     * 发送合并转发(私聊)
     * @param {number|string} user_id 用户QQ号
     * @param {Array} messages 消息节点列表
     * @returns {Promise<object>} 发送结果
     */
    async sendPrivateForwardMsg(user_id, messages) {
        try {
            console.log('[MediaApi] 发送私聊合并转发', user_id);
            
            // 确保消息是node格式
            const formattedMessages = this.formatForwardMessages(messages);
            
            return await this.client.callApi('send_private_forward_msg', {
                user_id: Number(user_id) || user_id,
                messages: formattedMessages
            });
        } catch (error) {
            console.error('[MediaApi] 发送私聊合并转发失败', error);
            throw error;
        }
    }
    
    /**
     * 格式化合并转发消息
     * @private
     * @param {Array} messages 消息列表
     * @returns {Array} 格式化后的消息列表
     */
    formatForwardMessages(messages) {
        if (!Array.isArray(messages)) {
            throw new Error('消息列表必须是数组');
        }
        
        return messages.map(msg => {
            // 如果已经是node格式，直接返回
            if (msg.type === 'node') {
                return msg;
            }
            
            // 尝试构建node格式
            const nodeData = {};
            
            if (msg.user_id) nodeData.uin = String(msg.user_id);
            if (msg.nickname || msg.name) nodeData.name = msg.nickname || msg.name || '匿名';
            
            // 处理消息内容
            if (msg.content) {
                nodeData.content = msg.content;
            } else if (msg.message) {
                nodeData.content = msg.message;
            } else {
                nodeData.content = '空消息';
            }
            
            return {
                type: 'node',
                data: nodeData
            };
        });
    }
    
    /**
     * 创建语音消息段
     * @param {string} file 语音文件路径或URL
     * @param {boolean} cache 是否使用缓存
     * @returns {object} 语音消息段
     */
    recordSegment(file, cache = true) {
        return {
            type: 'record',
            data: {
                file,
                cache: cache ? 1 : 0
            }
        };
    }
    
    /**
     * 创建图片消息段
     * @param {string} file 图片文件路径或URL
     * @param {boolean} cache 是否使用缓存
     * @param {boolean} proxy 是否通过代理下载图片
     * @returns {object} 图片消息段
     */
    imageSegment(file, cache = true, proxy = true) {
        return {
            type: 'image',
            data: {
                file,
                cache: cache ? 1 : 0,
                proxy: proxy ? 1 : 0
            }
        };
    }
    
    /**
     * 创建视频消息段
     * @param {string} file 视频文件路径或URL
     * @param {string} cover 视频封面
     * @returns {object} 视频消息段
     */
    videoSegment(file, cover = '') {
        return {
            type: 'video',
            data: {
                file,
                cover
            }
        };
    }
}

module.exports = MediaApi; 