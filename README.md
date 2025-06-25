# YiMo - 本地化强大Mock服务平台

YiMo 是一个基于 Spring Boot + Vue2 + Element UI 开箱即用的本地 Mock 服务平台，支持动态响应、分组管理、模板数据、条件匹配、延迟、状态码控制等功能，适合前后端分离开发、接口联调、自动化测试等场景。

## 主要特性
- 🚀 动态 Mock 响应（支持 JSON、文本等）
- 🗂️ API 分组与管理
- 🔍 多条件搜索与筛选
- ⏱️ 延迟、状态码、响应头自定义
- 🧩 模板引擎（内置如 {{uuid}}、{{timestamp}}、{{random.int}} 等）
- 🖥️ 现代化 Web 管理界面（Vue2 + Element UI，支持离线使用）
- 📦 一键导入导出配置
- 🛡️ 支持 H2 数据库，零依赖，开箱即用

## 快速启动
1. **环境要求**：JDK 21+，Maven 3.6+
2. **启动服务**：
```bash
git clone <your-repo-url>
cd YiMo
mvn spring-boot:run
```
3. **访问管理界面**：
   - http://localhost:8080/index.html

## 使用说明
- 通过 Web 管理界面创建分组、添加 API 配置、编辑/删除/启用/禁用接口
- 支持按分组、方法、状态等多条件筛选和分页浏览
- 响应内容支持模板语法，自动生成动态数据
- 可一键导入导出所有配置，便于迁移和备份

## 模板语法示例
在响应内容中可用如下模板：
```json
{
  "id": "{{uuid}}",
  "name": "{{random.string(8)}}",
  "age": {{random.int(18,65)}},
  "timestamp": {{timestamp}},
  "created_at": "{{now}}"
}
```
- `{{uuid}}` 生成唯一ID
- `{{timestamp}}` 当前时间戳
- `{{now}}` 当前时间字符串
- `{{random.int(min,max)}}` 随机整数
- `{{random.string(length)}}` 随机字符串

## 常见问题
- **前端可离线使用吗？**
  > 可以，所有依赖均已本地化，无需外网。
- **如何自定义模板函数？**
  > 目前支持内置常用函数，后续可扩展，详见源码。
- **如何修改端口/数据库？**
  > 配置文件在 `src/main/resources/application.yaml`。

## 致谢
- [Spring Boot](https://spring.io/projects/spring-boot)
- [Vue.js](https://vuejs.org/)
- [Element UI](https://element.eleme.io/)
- [MyBatis](https://mybatis.org/)
- [Knife4j](https://doc.xiaominfo.com/)

---
如有建议或问题，欢迎 Issue 或 PR！ 