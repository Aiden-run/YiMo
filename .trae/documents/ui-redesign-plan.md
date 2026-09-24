# YiMo UI 整体重构计划

## Context

YiMo 前端管理界面当前使用 Vue2 + Element UI，采用"上下双卡片"布局。用户希望**整体重构** UI —— 移除 Element UI，自建暗色系
CSS 设计系统，改为"左侧栏分组 + 右侧主区 API 列表"布局，所有业务逻辑保持不变。

## 核心策略

**新增 `yimo-ui.js` 兼容层**：在 Vue.prototype 上注入 `$message`/`$confirm`，注册 `ym-form`/`ym-modal`
等自定义组件，使 `app.js` 业务逻辑改动 < 30 行。

## 文件改动清单

| 文件                          | 操作     | 说明                                                       |
|-----------------------------|--------|----------------------------------------------------------|
| `static/index.html`         | 全量重写   | 新布局 + 暗色 CSS 设计系统 + 自定义组件模板                              |
| `static/js/yimo-ui.js`      | **新增** | Icons 字典、ym-* 组件注册、Toast/Confirm 系统、$message/$confirm 注入 |
| `static/js/app.js`          | 极小改动   | 仅模板相关的几处（图标引用、移除 popover 模板），方法体零改动                      |
| `static/js/config.js`       | 不动     | —                                                        |
| `static/lib/element-ui.js`  | 删除     | 移除 Element UI                                            |
| `static/lib/element-ui.css` | 删除     | 移除 Element UI 样式                                         |
| `static/lib/fonts/`         | 删除     | Element 图标字体                                             |
| `static/js/app.js.backup`   | 删除     | 旧备份                                                      |

## 设计系统

- **主题**：暗色（`#0d1117` 背景 + `#2f81f7` 蓝色强调）
- **布局**：顶部 header + 左侧栏 280px（分组列表）+ 右侧主区（API 列表）
- **CSS 变量**：背景/文本/边框/强调色/间距/圆角/阴影/字体 全套变量
- **组件前缀**：`ym-`（ym-btn、ym-input、ym-modal、ym-form、ym-pagination 等）

## yimo-ui.js 组件清单

| 组件                         | 替换的 Element 组件           | 关键点                                                |
|----------------------------|--------------------------|----------------------------------------------------|
| `ym-icon`                  | el-icon-*                | 内联 SVG（Lucide 风格），无字体依赖                            |
| `ym-btn`                   | el-button                | CSS variant 控制类型/尺寸                                |
| `ym-input`                 | el-input                 | 原生 input/textarea + 样式包装                           |
| `ym-select`                | el-select + el-option    | 原生 select + `color-scheme: dark`                   |
| `ym-switch`                | el-switch                | label + checkbox + slider                          |
| `ym-modal`                 | el-dialog                | mask + ESC 关闭 + body 滚动锁定                          |
| `ym-form` + `ym-form-item` | el-form + el-form-item   | validate() 支持 Promise + 回调，resetFields()           |
| `ym-pagination`            | el-pagination            | 计算页码窗口，emit current-change                         |
| `$message`                 | el-message               | Toast 滑入动画，3s 消失，支持 .success/.error/.warning/.info |
| `$confirm`                 | el-messagebox ($confirm) | Promise 风格，reject('cancel') 与原行为一致                 |

## app.js 改动点（仅模板/图标引用，方法体不动）

- `el-icon-*` → `<ym-icon name="...">`
- 分组列表删除按钮：移除 `el-popconfirm` 包裹，直接调用 `deleteGroup`
- 编辑分组弹框内 `el-popover` 删除链接 → 移除，由 `deleteGroup` 内 `$confirm` 处理
- 所有 `this.$message.*`、`this.$confirm(...)`、`this.$refs.apiForm.validate()` 调用零改动

## 实施步骤

1. 创建 `yimo-ui.js`：注册全部组件 + Toast/Confirm 系统
2. 重写 `index.html`：CSS 变量 + 暗色样式 + 新布局 HTML
3. 微调 `app.js`：替换图标引用，移除 popover 模板
4. 删除 Element UI 依赖文件
5. 回归测试

## 风险与应对

| 风险                   | 应对                                                   |
|----------------------|------------------------------------------------------|
| SSE 流式响应弹框           | ym-modal 内 `{{ currentResponse.data }}` 仍是响应式绑定，逻辑不变 |
| 表单验证                 | ym-form.validate() 同时支持 Promise 和回调，仅实现 required 规则  |
| 原生 select 暗色下拉       | `style="color-scheme: dark"`                         |
| transition-group ref | 现有 `el.$el \|\| el` fallback 写法已兼容                   |

## 验证

1. 分组 CRUD + 无限滚动 + 点击筛选
2. API CRUD + 必填校验 + 启用/禁用
3. 搜索筛选 + 分页
4. 请求 API（JSON + SSE GET + SSE 非 GET）
5. Toast 通知 + 二次确认弹框
6. 断网离线打开，无外链请求
7. 控制台无报错、无 Vue warning
