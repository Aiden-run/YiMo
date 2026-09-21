<h1 align="center">YiMo</h1>

<p align="center">🚀 本地 Mock 服务平台 · 开箱即用 · 零外部依赖</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.4.4-green?logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/JDK-21+-orange?logo=openjdk" alt="JDK">
  <img src="https://img.shields.io/badge/Vue-2-brightgreen?logo=vuedotjs" alt="Vue">
  <img src="https://img.shields.io/badge/H2-2.3.232-blue?logo=h2database" alt="H2">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

> 基于 Spring Boot 3 + Vue2 + Element UI 的本地 Mock 服务，零外部依赖，适合前后端分离开发、接口联调与自动化测试。

## 📖 YiMo 是什么

YiMo 是一个**本地运行的 Mock 服务**。

当后端接口还没开发完成，前端又需要对接联调时 —— YiMo 让你在本地起一个服务，通过 Web 界面配置好接口路径和返回数据，前端就像请求真实后端一样拿到响应。

### 🎯 典型使用场景

| 场景 | 说明 |
| :---: | :--- |
| 🏗️ **前后端并行开发** | 后端还在写接口，前端先配好 Mock 数据即可开工，不再互相阻塞 |
| 🔧 **接口联调调试** | 后端接口不稳或依赖第三方时，用 Mock 临时替代，保证联调进度 |
| 🧪 **自动化测试** | 为测试用例提供稳定的 Mock 响应，不受真实环境波动影响 |
| 🎨 **演示与原型** | 产品演示或原型验证时，无需真实后端即可展示完整交互效果 |

### ⚡ 工作方式

```
启动 YiMo  →  Web 界面配置接口  →  前端请求 /api/**  →  返回 Mock 数据
```

1. 启动 YiMo，打开 `http://localhost:9091/index.html` 进入管理界面
2. 创建一个分组（如"用户模块"），在分组下添加接口配置（路径、方法、返回内容）
3. 前端请求 `http://localhost:9091/api/你的接口路径`，YiMo 返回你配置的 Mock 数据
4. 支持模板函数动态生成数据（如随机 ID、当前时间），也支持设置延迟模拟弱网

---

## 📑 目录

- [📖 YiMo 是什么](#-yimo-是什么)
- [✨ 主要特性](#-主要特性)
- [🛠️ 技术栈](#️-技术栈)
- [🚀 快速启动](#-快速启动)
- [📁 项目结构](#-项目结构)
- [⚙️ 核心功能](#️-核心功能)
- [🔧 模板函数](#-模板函数)
- [📡 管理接口](#-管理接口)
- [📋 配置说明](#-配置说明)
- [❓ 常见问题](#-常见问题)
- [💝 致谢](#-致谢)

---

## ✨ 主要特性

| 特性 | 说明 |
| :---: | :--- |
| 🚀 **动态 Mock 响应** | 支持 JSON、SSE 流式响应，可配置状态码、响应延迟、自定义响应头 |
| 🗂️ **API 分组管理** | 按业务模块分组，支持分组级 Base URL 配置 |
| 📨 **模板引擎** | 内置日期、UUID、雪花 ID 等模板函数，响应内容动态生成 |
| 🖥️ **Web 管理界面** | Vue2 + Element UI，所有依赖本地化，无需外网即可使用 |
| 🛡️ **零依赖部署** | 内嵌 H2 文件数据库，clone 即用 |
| 📚 **接口文档** | 集成 Knife4j (OpenAPI3)，启动后自动可用 |

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
| :--- | :--- | :---: |
| 后端框架 | Spring Boot | 3.4.4 |
| 持久层 | MyBatis + PageHelper | 3.0.3 / 2.1.0 |
| 数据库 | H2（文件模式） | 2.3.232 |
| 接口文档 | Knife4j（OpenAPI3） | 4.4.0 |
| 前端 | Vue2 + Element UI | — |
| 工具库 | Hutool / Lombok | 5.8.39 / — |
| JDK | OpenJDK | 21+ |

---

## 🚀 快速启动

> **环境要求**：JDK 21+、Maven 3.6+

```bash
git clone git@github.com:Aiden-run/YiMo.git
cd YiMo
mvn spring-boot:run
```

启动后访问：

| 入口 | 地址 |
| :---: | :--- |
| 🖥️ 管理界面 | http://localhost:9091/index.html |
| 📚 接口文档 | http://localhost:9091/doc.html |

> 💡 Mock 请求统一以 `/api/` 为前缀，例如配置了 URL 为 `/user/login` 的接口，请求 `http://localhost:9091/api/user/login` 即可获取 Mock 响应。

---

## 📁 项目结构

```
src/main/java/top/paidaxin/
├── YiMoApplication.java               # 启动类
├── common/
│   ├── config/H2Config/               # H2 数据库启动与版本迁移
│   ├── exception/                     # 全局异常处理
│   ├── utils/                         # Jackson、Spring 工具类
│   └── vo/                            # 统一响应体、分页、枚举常量
├── controller/
│   ├── admin/                         # 管理接口（分组、配置 CRUD）
│   └── api/                           # Mock 请求统一入口 /api/**
├── dao/
│   ├── entity/                        # ApiConfig、ApiGroup 实体
│   └── *.java                         # MyBatis Mapper 接口
└── service/
    ├── admin/                         # 分组、配置、H2 升级服务
    └── client/
        ├── strategy/                  # 响应策略（JSON / SSE Stream）
        ├── YiMoApiService.java        # Mock 请求匹配
        └── YiMoResponseTemplate.java  # 模板函数引擎

src/main/resources/
├── mapper/*.xml                       # MyBatis SQL 映射
├── static/                            # 前端管理界面（离线资源）
├── schema.sql                         # 建表脚本
├── application.yaml                   # 生产配置
└── application-dev.yaml               # 开发配置（H2 TCP 模式 + SQL 日志）
```

---

## ⚙️ 核心功能

### 请求处理流程

```
HTTP 请求 /api/**
    │
    ▼
ApiController.filterHttpRequest()
    │
    ├── 1️⃣  提取 URL + Method → 查询数据库 Mock 配置
    │         └── 无匹配 → 返回 404
    │
    ├── 2️⃣  模板渲染（若 is_template = 1）
    │         └── 替换 ${date} / ${uuid} 等占位符
    │
    └── 3️⃣  ResponseStrategyFactory 按 Content-Type 分发
              ├── JsonResponseStrategy   → JSON 响应
              └── StreamResponseStrategy → SSE 流式响应
```

### API 配置字段

| 字段 | 说明 | 默认值 |
| :--- | :--- | :---: |
| `apiUrl` | Mock 接口路径 | — |
| `apiMethod` | HTTP 方法 | `GET` |
| `response` | Mock 响应内容 | — |
| `contentType` | 响应类型 | `application/json` |
| `statusCode` | HTTP 状态码 | `200` |
| `delay` | 响应延迟（毫秒） | `0` |
| `enabled` | 是否启用 | `true` |
| `isTemplate` | 是否启用模板渲染 | `0` |
| `responseHeaders` | 自定义响应头（JSON） | — |
| `requestMatch` | 请求参数匹配条件（JSON） | — |
| `headerMatch` | 请求头匹配条件（JSON） | — |

---

## 🔧 模板函数

> 在 API 配置中开启 `isTemplate` 后，响应内容中的占位符会被自动替换：

| 占位符 | 说明 | 示例输出 |
| :---: | :--- | :--- |
| `${date}` | 当前时间 | `2025-08-01 16:53:00` |
| `${uuid}` | UUID | `f45a3348-b9e9-4b18-836f-9d95808c6bae` |
| `${objectId}` | MongoDB ObjectId | `6789abcdef0123456789012` |
| `${snowflake}` | 雪花算法 ID | `1893748273648293847` |
| `${randomInt}` | 0~10000 随机数 | `7321` |

---

## 📡 管理接口

### 分组管理 `/admin/group`

| 方法 | 路径 | 说明 |
| :---: | :--- | :--- |
| `GET` | `/admin/group/list` | 分页查询分组列表 |
| `POST` | `/admin/group` | 创建分组 |
| `PUT` | `/admin/group` | 更新分组 |
| `DELETE` | `/admin/group/{groupId}` | 删除分组 |

### 配置管理 `/admin/config`

| 方法 | 路径 | 说明 |
| :---: | :--- | :--- |
| `GET` | `/admin/config/list` | 分页查询配置（支持按分组/名称/方法/状态筛选） |
| `POST` | `/admin/config` | 创建 API 配置 |
| `PUT` | `/admin/config` | 更新 API 配置 |
| `DELETE` | `/admin/config/{configId}` | 删除配置 |
| `PUT` | `/admin/config/{configId}/toggle` | 启用/禁用切换 |
| `GET` | `/admin/config/template/list` | 查询可用模板函数列表 |

---

## 📋 配置说明

### 生产环境 `application.yaml`

```yaml
server:
  port: 9091                              # 服务端口
spring:
  datasource:
    url: jdbc:h2:file:~/.YiMo/data/YiMo   # H2 文件数据库路径
    username: sa
    password: YiMo
```

### 开发环境 `application-dev.yaml`

> 开发模式下 H2 以 TCP 模式运行（`jdbc:h2:tcp://localhost:9092/...`），便于通过 H2 Console 直连调试，同时开启 DAO 层 SQL 日志。

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## ❓ 常见问题

<details>
<summary><b>前端可以离线使用吗？</b></summary>

> ✅ 可以。Vue、Element UI、axios 等依赖均已下载至 `src/main/resources/static/lib/`，无需外网。

</details>

<details>
<summary><b>如何修改端口或数据库路径？</b></summary>

> 编辑 `src/main/resources/application.yaml`，修改 `server.port` 或 `spring.datasource.url`。

</details>

<details>
<summary><b>数据库文件存在哪里？</b></summary>

> 默认在 `~/.YiMo/data/YiMo`（用户主目录下），首次启动自动创建。

</details>

<details>
<summary><b>部署到公网需要注意什么？</b></summary>

> 开放 9091 端口即可。建议根据实际安全需求调整 H2 数据库密码。

</details>

<details>
<summary><b>如何进行二次开发？</b></summary>

> 使用 dev 配置启动（`-Dspring-boot:run -Dspring-boot.run.profiles=dev`），H2 会以 TCP 模式运行，方便用 H2 Console 或 IDE 数据库工具直接查看数据。

</details>

<p align="center">如有建议或问题，欢迎 Issue 或 PR！</p>
