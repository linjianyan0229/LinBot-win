# OneBot API 模块

这个模块封装了基于 [OneBot 11](https://github.com/botuniverse/onebot-11) 标准和 [NapCatQQ](https://napneko.github.io/develop/api) 扩展的API，提供了一套易用的调用接口。

## 功能特点

- 完整支持 OneBot 11 标准API
- 支持 go-cqhttp 扩展API
- 支持 NapCatQQ 扩展API
- 模块化设计，按功能分类
- 类型提示和完整注释

## 安装

此模块是LinBot UI项目的一部分，不需要单独安装。

## 使用方法

### 基本用法

```javascript
// 引入API模块
const { ApiManager } = require('./api');

// 创建API管理器
const api = new ApiManager(window.electronAPI);

// 调用API
async function sendMessage() {
    try {
        // 发送私聊消息
        const result = await api.message.sendPrivateMsg('123456789', '你好，这是一条测试消息');
        console.log('消息发送结果:', result);
    } catch (error) {
        console.error('API调用失败:', error);
    }
}
```

### 消息相关API

```javascript
// 发送群消息
await api.message.sendGroupMsg('123456789', '大家好，这是一条测试消息');

// 撤回消息
await api.message.deleteMsg('123456789'); // 消息ID

// 获取消息
const msg = await api.message.getMsg('123456789'); // 消息ID
```

### 群组相关API

```javascript
// 获取群列表
const groupList = await api.group.getGroupList();

// 获取群信息
const groupInfo = await api.group.getGroupInfo('123456789');

// 获取群成员列表
const memberList = await api.group.getGroupMemberList('123456789');

// 设置群名片
await api.group.setGroupCard('123456789', '987654321', '新群名片');
```

### 好友相关API

```javascript
// 获取好友列表
const friendList = await api.friend.getFriendList();

// 获取陌生人信息
const strangerInfo = await api.friend.getStrangerInfo('123456789');

// 发送好友赞
await api.friend.sendLike('123456789', 10);
```

### 账号相关API

```javascript
// 获取登录信息
const loginInfo = await api.account.getLoginInfo();

// 设置在线状态
await api.account.setOnlineStatus(11); // 11=在线

// 设置个人签名
await api.account.setSelfLongnick('这是我的个性签名');
```

### 多媒体和文件API

```javascript
// 上传群文件
await api.media.uploadGroupFile('123456789', '/path/to/file.txt', 'file.txt');

// 获取图片信息
const imageInfo = await api.media.getImage('图片文件名');

// 检查是否可以发送图片
const canSendImage = await api.media.canSendImage();
```

### 直接调用API

如果需要调用尚未封装的API，可以使用`call`方法直接调用：

```javascript
// 直接调用API
const result = await api.call('custom_api_name', {
    param1: 'value1',
    param2: 'value2'
});
```

## API分类

- `message`: 消息相关API
- `group`: 群组相关API
- `friend`: 好友相关API
- `account`: 账号相关API
- `media`: 多媒体和文件相关API

更多API详情请参考[NapCatQQ API文档](https://napneko.github.io/develop/api)。 