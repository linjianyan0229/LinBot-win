# LinBot UI - 反向WebSocket服务端

这是一个基于Electron的桌面应用程序，用作OneBot反向WebSocket连接的服务端。

## 功能特点

- 监听指定端口，等待OneBot客户端连接 (反向WebSocket模式)
- 支持通过 `Authorization: Bearer <token>` Header 进行 Access Token 认证
- 实时显示服务器运行状态、客户端连接状态
- 分页显示服务器日志和接收到的OneBot事件/API响应日志
- 配置信息 (端口, Token, 心跳显示) 存储在项目根目录的 `config.json` 文件中
- 简洁美观的用户界面
- 包含一个基础的API调用示例 (主进程 -> OneBot客户端)

## 安装

1. 确保已安装Node.js (推荐v16或更高版本，因为使用了较新的Electron特性)
2. 克隆此仓库
3. 安装依赖：
先设置临时变量：
    $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
    $env:ELECTRON_CUSTOM_DIR="{{ version }}"
```bash
npm install
```

## 运行

开发模式 (推荐，会打开开发者工具):
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 构建
打包前先清除临时变量：

   $env:ELECTRON_CUSTOM_DIR=""
    # 或者设置为 $null
    # $env:ELECTRON_CUSTOM_DIR = $null

构建可执行文件：
```bash
npm run build
```

## 使用说明

1.  **启动 LinBot UI 应用程序**。
2.  在界面中设置 **监听端口** (例如 `8080`)。
3.  如果需要认证，设置 **Access Token**。
4.  点击 **"启动服务"** 按钮。状态栏会显示服务正在运行并等待连接。
5.  **配置您的 OneBot 实现**：
    *   确保 OneBot 实现工作在 **反向 WebSocket** 模式。
    *   将 OneBot 的 **连接目标 URL** 设置为 LinBot UI 正在监听的地址，例如 `ws://127.0.0.1:8080` (如果都在本机) 或 `ws://<运行LinBotUI的机器IP>:端口号`。
    *   如果 LinBot UI 设置了 Access Token，确保 OneBot 实现会通过 `Authorization: Bearer <您的Token>` HTTP Header 发送令牌。
6.  **启动您的 OneBot 实现**。它应该会连接到 LinBot UI。
7.  连接成功后，LinBot UI 的状态栏会显示"客户端已连接"，您可以在"服务器日志"和"事件日志"标签页查看到相应的日志和 OneBot 事件。

## 注意事项

-   本应用扮演 **服务端** 角色，等待 OneBot 客户端来连接。
-   目前只支持 **一个** OneBot 客户端同时连接。
-   Access Token 验证是通过检查连接请求的 `Authorization: Bearer <token>` Header 实现的。
-   连接配置（端口、Token、心跳显示开关）会自动保存在**应用程序可执行文件（例如 .exe）所在的目录**下的 `config.json` 文件中。
-   **注意**: 如果将打包后的应用放在需要管理员权限才能写入的目录（如 C:\Program Files），配置可能无法保存。 