// Vue应用实例
new Vue({
    el: '#app',
    data() {
        return {
            isInitialLoad: true, // 控制首次加载动画
            isRefreshing: false, // 控制刷新按钮状态
            initialLoading: true, // 控制骨架屏
            // 主题模式：默认白天
            theme: localStorage.getItem('yimo-theme') || 'light',
            // 标签页控制
            activeTab: 'api',
            // API列表数据
            apis: [],
            groups: [], // For dropdowns
            groupList: [], // For paginated list
            groupListCurrentPage: 1,
            groupListPageSize: 15,
            groupListTotal: 0,
            groupListLoading: false,
            loading: false,

            // 分页
            currentPage: 1,
            pageSize: 10,
            total: 0,

            // 搜索和筛选
            searchKeyword: '',
            selectedGroup: '',
            selectedMethod: '',
            selectedStatus: '',
            // API 方法筛选下拉的动态选项（从已配置 API 去重生成）
            apiMethodOptions: [],
            searchTimeout: null,

            // 对话框控制
            showCreateDialog: false,
            showGroupDialog: false,
            showResponseDialog: false,
            showTemplateHelpDialog: false, // 控制模板说明对话框
            editingApi: null,
            editingGroup: null,
            deletePopoverVisible: false,

            // 模板变量
            templateConstants: [],
            templateList: [],
            templateSearchKeyword: '',
            templateLoading: false,

            // 调用日志
            showApiLogsDialog: false,
            apiLogs: [],
            apiLogSearchIp: '',
            apiLogMethodFilter: '',
            // 调用日志详情
            showLogDetailDialog: false,
            logDetail: null,

            // 数据看板
            dashboardStats: null,

            // 响应弹框数据
            currentResponse: null,
            currentStreamRequest: null, // 当前流式请求的xhr对象

            // 表单数据
            apiForm: {
                apiConfigId: '', // API配置ID
                apiConfigName: '',
                apiGroupId: '',
                apiUrl: '',
                apiMethod: 'GET',
                statusCode: 200,
                delay: 0,
                response: '',
                comment: '',
                enabled: true,
                template: false, // 控制模板变量替换
                contentType: 'application/json',
                streamEnabled: false // 控制是否启用流式返回，默认不勾选
            },

            groupForm: {
                apiGroupId: '',
                apiGroupName: '',
                apiBaseUrl: ''
            },

            // 表单验证规则
            apiRules: {
                apiConfigName: [
                    {required: true, message: '请输入API名称', trigger: 'blur'}
                ],
                apiGroupId: [
                    {required: true, message: '请选择所属分组', trigger: 'change'}
                ],
                apiUrl: [
                    {required: true, message: '请输入API路径', trigger: 'blur'}
                ],
                apiMethod: [
                    {required: true, message: '请选择请求方法', trigger: 'change'}
                ],
                response: [
                    {required: true, message: '请输入响应内容', trigger: 'blur'}
                ]
            },

            groupRules: {
                apiGroupName: [
                    {required: true, message: '请输入分组名称', trigger: 'blur'}
                ],
                apiBaseUrl: [
                    {required: true, message: '请输入基础URL', trigger: 'blur'}
                ]
            },

            // MoYi 调试模式状态（浏览器直连远程接口，数据仅存本地）
            requestMode: localStorage.getItem('yimo-mode') === 'moyi',
            requestMethod: 'GET',
            requestUrl: '',
            requestParams: [],
            requestHeaders: [],
            requestBody: '',
            requestBodyType: 'application/json',
            activeReqTab: 'params',
            requestSending: false,
            requestResponse: null,
            requestFavUrls: [],
            requestWithCredentials: false,
            requestRowSeq: 0,
            requestAbortController: null
        }
    },

    computed: {
        // 是否存在筛选/搜索条件（决定空态文案及是否显示「清空筛选」）
        hasActiveFilters() {
            return !!(this.searchKeyword || this.selectedGroup || this.selectedMethod || this.selectedStatus);
        },
        // 调用日志：本次查询到的记录数（即累计调用次数的近似值）
        apiLogsTotal() {
            return this.apiLogs.length;
        },
        // 调用日志：命中的接口数（按 方法+URL 去重）
        apiLogsInterfaceCount() {
            return new Set(this.apiLogs.map(d => (d.apiMethod || '') + '|' + (d.apiUrl || ''))).size;
        },
        // 调用日志：按 IP 关键词 + 请求方法筛选后的记录
        filteredApiLogs() {
            const ip = (this.apiLogSearchIp || '').trim().toLowerCase();
            const method = this.apiLogMethodFilter || '';
            return this.apiLogs.filter(d => {
                if (method && (d.apiMethod || '') !== method) return false;
                if (ip && !String(d.ip || '').toLowerCase().includes(ip)) return false;
                return true;
            });
        },
        // 调用日志：实际存在的方法列表（用于筛选下拉，动态生成而非写死）
        apiLogMethods() {
            const methods = new Set();
            (this.apiLogs || []).forEach(d => {
                if (d.apiMethod) methods.add(d.apiMethod);
            });
            return Array.from(methods).sort();
        },
        // 格式化的响应内容
        formattedResponse() {
            if (!this.currentResponse || !this.currentResponse.data) {
                return '';
            }

            // 如果是流式响应，直接显示原始内容
            if (this.currentResponse.isStreaming !== undefined ? this.currentResponse.isStreaming || this.currentResponse.contentType === 'text/event-stream' : this.currentResponse.contentType === 'text/event-stream') {
                const content = typeof this.currentResponse.data === 'string'
                    ? this.currentResponse.data
                    : JSON.stringify(this.currentResponse.data, null, 2);

                // 如果是正在流式传输，添加实时更新标识
                const streamingIndicator = this.currentResponse.isStreaming ? '\n\n数据流式传输中...' : '';

                // 直接返回原始内容，不进行特殊格式化
                return this.safeHighlight(content + streamingIndicator, 'plaintext');
            }

            try {
                // 尝试格式化JSON
                const formatted = JSON.stringify(this.currentResponse.data, null, 2);
                // 使用安全的语法高亮
                return this.safeHighlight(formatted, 'json');
            } catch (error) {
                // 如果不是JSON，直接返回原始内容
                const content = typeof this.currentResponse.data === 'string'
                    ? this.currentResponse.data
                    : String(this.currentResponse.data);
                return this.safeHighlight(content, 'plaintext');
            }
        },
        // 过滤后的模板列表
        filteredTemplateList() {
            if (!this.templateSearchKeyword) {
                return this.templateList;
            }
            const keyword = this.templateSearchKeyword.toLowerCase();
            return this.templateList.filter(template =>
                template.templateName.toLowerCase().includes(keyword) ||
                template.templateDescription.toLowerCase().includes(keyword) ||
                template.apiUrl.toLowerCase().includes(keyword)
            );
        },
        // GET/HEAD/OPTIONS 不支持请求体
        requestHasBody() {
            return ['GET', 'HEAD', 'OPTIONS'].indexOf(this.requestMethod) === -1;
        },
        // 请求体输入区语法高亮（JSON 按类型着色，其余纯文本）
        requestBodyHighlightHtml() {
            const text = this.requestBody || '';
            const lang = this.requestBodyType === 'application/json' ? 'json' : 'plaintext';
            return this.safeHighlight(text, lang);
        },
        // Mock 表单响应内容输入区语法高亮（JSON 按类型着色，模板变量作为字符串处理）
        mockResponseHighlightHtml() {
            const text = this.apiForm.response || '';
            const lang = this.apiForm.contentType === 'application/json' ? 'json' : 'plaintext';
            return this.safeHighlight(text, lang);
        },
        // 响应内容格式化 + 语法高亮
        requestResponseHtml() {
            if (!this.requestResponse || !this.requestResponse.text) {
                return '';
            }
            let text = this.requestResponse.text;
            // 内容为 JSON 时美化
            if (/^\s*[{[]/.test(text)) {
                try {
                    text = JSON.stringify(JSON.parse(text), null, 2);
                    return this.safeHighlight(text, 'json');
                } catch (e) { /* 非合法 JSON，按纯文本处理 */
                }
            }
            return this.safeHighlight(text, 'plaintext');
        }
    },

    mounted() {
        // 移除启动加载动画
        const bootLoader = document.getElementById('boot-loader');
        if (bootLoader) {
            bootLoader.classList.add('is-hidden');
            setTimeout(() => {
                if (bootLoader.parentNode) bootLoader.parentNode.removeChild(bootLoader);
            }, 350);
        }
        this.loadData();
        this.loadRequestFavs();
    },

    beforeDestroy() {
        // 清理定时器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    },

    methods: {
        filterByGroup(group) {
            if (group && group.apiGroupId) {
                // 如果点击的是当前已选中的分组，则取消选中
                if (this.selectedGroup === group.apiGroupId) {
                    this.selectedGroup = '';
                } else {
                    this.selectedGroup = group.apiGroupId;
                    this.activeTab = 'api';
                }
            }
        },

        // 加载数据
        async loadData() {
            this.initialLoading = true;
            // Reset group list state before loading
            this.groupList = [];
            this.groupListCurrentPage = 1;
            this.groupListTotal = 0;
            try {
                await Promise.all([
                    this.loadGroupList(), // Load paginated list for management view
                    this.loadAllGroupsForDropdown(), // Load all groups for select dropdowns
                    this.loadApis(), // Load API list
                    this.loadApiMethodOptions(), // API 方法筛选下拉动态选项
                    this.loadDashboard() // 数据看板
                ]);
            } catch (error) {
                this.$message.error('加载数据失败: ' + error.message);
            } finally {
                this.initialLoading = false;
                // 首次加载完成后，启用后续动画
                this.$nextTick(() => {
                    this.isInitialLoad = false;
                });
            }
        },

        async handleRefreshClick() {
            if (this.isRefreshing) return;
            this.isRefreshing = true;

            await this.loadApis(); // 调用静默加载
            this.loadApiMethodOptions(); // 方法选项同步刷新
            this.loadDashboard(); // 数据看板同步刷新

            setTimeout(() => {
                this.isRefreshing = false;
            }, 1000);
        },

        // Load paginated list of groups for the management card
        async loadGroupList() {
            if (this.groupListLoading) return;

            // 检查是否已经加载完所有数据
            if (this.groupList.length >= this.groupListTotal && this.groupListTotal > 0) return;

            this.groupListLoading = true;
            try {
                const response = await axios.get('/admin/group/list', {
                    params: {
                        pageNum: this.groupListCurrentPage,
                        pageSize: this.groupListPageSize
                    }
                });

                if (response.data.code === 200 && response.data.data) {
                    const newData = response.data.data.list || [];
                    const total = response.data.data.total || 0;

                    // 检查返回的数据是否为空
                    if (newData.length === 0 && this.groupListCurrentPage > 1) {
                        return;
                    }

                    // 第一页时替换数据，后续页面追加数据
                    if (this.groupListCurrentPage === 1) {
                        this.groupList = newData;
                    } else {
                        this.groupList = [...this.groupList, ...newData];
                    }

                    this.groupListTotal = total;

                    // 只有在成功加载数据时才增加页码
                    if (newData.length > 0) {
                        this.groupListCurrentPage++;
                    }
                }
            } catch (error) {
                this.$message.error('加载分组列表失败');
            } finally {
                this.groupListLoading = false;
            }
        },

        // Load all groups (up to a limit) for dropdowns
        async loadAllGroupsForDropdown() {
            try {
                const response = await axios.get('/admin/group/list', {
                    params: {pageNum: 1, pageSize: 100} // Load up to 100 groups for dropdowns
                });
                if (response.data.code === 200) {
                    this.groups = response.data.data.list || [];
                }
            } catch (error) {
                this.groups = [];
            }
        },

        // 加载 API 方法筛选下拉选项（去重，按实际配置动态生成）
        async loadApiMethodOptions() {
            try {
                const response = await axios.get('/admin/config/methods');
                if (response.data && response.data.code === 200) {
                    this.apiMethodOptions = response.data.data || [];
                }
            } catch (error) {
                // 方法选项为非关键数据，加载失败静默处理
            }
        },

        // 加载API列表 (静默)
        async loadApis() {
            try {
                const response = await axios.get('/admin/config/list', {
                    params: {
                        pageNum: this.currentPage,
                        pageSize: this.pageSize,
                        groupId: this.selectedGroup || undefined,
                        apiName: this.searchKeyword || undefined,
                        method: this.selectedMethod || undefined,
                        status: this.selectedStatus === '' ? undefined : this.selectedStatus
                    }
                });
                if (response.data.code === 200) {
                    this.apis = response.data.data.list || [];
                    this.total = response.data.data.total || 0;
                }
            } catch (error) {
                this.apis = [];
                this.total = 0;
            }
        },

        // 清空搜索与筛选条件
        clearApiFilters() {
            // 重置期间抑制筛选 watcher，只发一次请求
            this._suppressFilterWatch = true;
            this.searchKeyword = '';
            this.selectedGroup = '';
            this.selectedMethod = '';
            this.selectedStatus = '';
            this._suppressFilterWatch = false;
            this.currentPage = 1;
            clearTimeout(this.searchTimeout);
            this.loadApis();
        },

        // 编辑API
        editApi(api) {
            this.editingApi = api;

            // 使用对象展开，但确保包含所有字段
            this.apiForm = {
                ...this.apiForm, // 保留默认值
                ...api, // 覆盖API数据
                streamEnabled: (api.contentType === 'text/event-stream') // 确保streamEnabled正确
            };

            this.showCreateDialog = true;
        },

        // 打开新建API对话框，默认带入选中的分组
        openCreateDialog() {
            this.resetApiForm();
            // 侧边栏选中了分组时，自动带入选中的分组
            if (this.selectedGroup) {
                this.apiForm.apiGroupId = this.selectedGroup;
            }
            this.showCreateDialog = true;
        },

        // 切换白天/夜晚主题
        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('yimo-theme', this.theme);
            document.documentElement.setAttribute('data-theme', this.theme);
        },

        // 保存API
        async saveApi() {
            try {
                await this.$refs.apiForm.validate();

                // 自动格式化API路径
                let apiUrl = this.apiForm.apiUrl;
                if (apiUrl && typeof apiUrl === 'string') {
                    if (apiUrl.charAt(0) !== '/') {
                        apiUrl = '/' + apiUrl;
                    }
                    if (apiUrl.length > 1 && apiUrl.charAt(apiUrl.length - 1) === '/') {
                        apiUrl = apiUrl.slice(0, -1);
                    }
                    this.apiForm.apiUrl = apiUrl;
                }

                // 根据streamEnabled设置contentType
                const formData = {...this.apiForm};
                formData.contentType = formData.streamEnabled ? 'text/event-stream' : 'application/json';

                const url = this.editingApi ? '/admin/config' : '/admin/config';
                const method = this.editingApi ? 'put' : 'post';

                const response = await axios[method](url, formData);

                if (response.data.code === 200) {
                    this.$message.success(this.editingApi ? '更新成功' : '创建成功');
                    this.showCreateDialog = false;
                    this.resetApiForm();
                    this.loadApis(); // Only reload the API list
                    this.loadApiMethodOptions(); // 方法选项同步刷新
                    this.loadDashboard();
                } else {
                    this.$message.error(response.data.message || '操作失败');
                }
            } catch (error) {
                // We only want to show a message for actual errors, not for validation failures.
                // Element UI's validation rejects with an object of validation errors, which isn't an `Error` instance.
                if (error instanceof Error) {
                    if (error.response) {
                        // Server responded with a status code that falls out of the range of 2xx
                        const errorMessage = error.response.data && error.response.data.message
                            ? error.response.data.message
                            : '服务器错误';
                        this.$message.error('操作失败: ' + errorMessage);
                    } else {
                        // For other errors (network, etc.), show the error message.
                        this.$message.error('操作失败: ' + error.message);
                    }
                }
                // If it's not an `Error` instance, it's a validation failure, and we do nothing.
            }
        },

        // 删除API
        async deleteApi(apiId) {
            if (!apiId) {
                this.$message.error('API配置ID为空');
                return;
            }

            this.$confirm('确定要删除这个API配置吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const response = await axios.delete(`/admin/config/${apiId}`);
                    if (response.data.code === 200) {
                        this.$message.success('删除成功');
                        this.loadApis();
                        this.loadApiMethodOptions(); // 方法选项同步刷新
                        this.loadDashboard();
                    } else {
                        this.$message.error(response.data.message || '删除失败');
                    }
                } catch (apiError) {
                    this.$message.error('删除失败: ' + (apiError.message || '网络错误'));
                }
            }).catch(() => {
                // 用户取消操作（点击取消、ESC或关闭按钮）
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },

        // 显示模板变量说明
        async showTemplateHelp() {
            this.templateLoading = true;
            this.showTemplateHelpDialog = true;
            try {
                const response = await axios.get('/admin/config/template/list');
                if (response.data.code === 200) {
                    this.templateConstants = response.data.data || [];
                } else {
                    this.$message.error('加载模板变量失败: ' + response.data.message);
                    this.showTemplateHelpDialog = false; // 加载失败时关闭弹窗
                }
            } catch (error) {
                this.$message.error('加载模板变量失败: ' + (error.message || '网络错误'));
                this.showTemplateHelpDialog = false; // 加载失败时关闭弹窗
            } finally {
                this.templateLoading = false;
            }
        },

        // 打开调用日志弹窗并加载数据（左侧明细表格 + 右侧今日调用概览）
        async showApiLogs() {
            this.showApiLogsDialog = true;
            // 日志表格 + 概览统计一起刷新
            await Promise.all([this.loadApiLogs(), this.loadDashboard()]);
        },

        // 加载调用日志
        async loadApiLogs() {
            try {
                const response = await axios.get('/api-details/log');
                this.apiLogs = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                this.apiLogs = [];
                this.$message.error('加载调用日志失败: ' + (error.message || ''));
            }
        },

        // 刷新调用日志 + 右侧今日概览统计
        async refreshApiLogs() {
            await Promise.all([this.loadApiLogs(), this.loadDashboard()]);
        },

        // 打开调用日志详情弹窗
        openLogDetail(log) {
            this.logDetail = log;
            this.showLogDetailDialog = true;
        },

        // 时间格式化：yyyy-MM-dd'T'HH:mm:ss -> yyyy-MM-dd HH:mm:ss
        formatLogTime(time) {
            if (!time) return '-';
            return String(time).replace('T', ' ').slice(0, 19);
        },

        // 耗时格式化：>=1s 显示 x.x s，否则显示 x ms，未知显示 -
        formatLogDuration(ms) {
            if (ms == null || ms < 0) return '-';
            if (ms >= 1000) return (ms / 1000).toFixed(1) + ' s';
            return ms + ' ms';
        },

        // 字节数格式化：B / KB / MB，未知显示 -
        formatBytes(size) {
            if (size == null || size < 0) return '-';
            if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
            if (size >= 1024) return (size / 1024).toFixed(1) + ' KB';
            return size + ' B';
        },

        // 看板：方法调用次数占总调用次数的百分比（0-100）
        dashboardPercent(count) {
            const total = this.dashboardStats ? this.dashboardStats.totalCalls : 0;
            if (!total || !count) return 0;
            return Math.round((count / total) * 100);
        },

        // 概览面板：次数相对当前列表最大值的百分比，用于排行/分组条形图（小值保底可见）
        barsPercent(count, list) {
            const max = (list && list.length) ? (list[0].count || 0) : 0;
            if (!max || !count) return 0;
            const p = (count / max) * 100;
            return Math.round(p < 5 ? 5 : p);
        },

        // 概览面板：排行序号两位补零（01、02 …）
        fmtRank(n) {
            return (n < 10 ? '0' : '') + n;
        },

        // 调用日志：状态码配色（2xx 成功 / 4xx 及以上异常 / 其他中性）
        logStatusCls(code) {
            const n = parseInt(code, 10);
            if (n >= 200 && n < 300) return 'ok';
            if (n >= 400) return 'bad';
            return 'def';
        },

        // 加载数据看板（分组/API总数 + 今日调用统计）
        async loadDashboard() {
            try {
                const response = await axios.get('/api-details/stats');
                if (response.data && response.data.code === 200) {
                    this.dashboardStats = response.data.data || null;
                } else {
                    this.dashboardStats = null;
                }
            } catch (error) {
                // 看板为非关键数据，加载失败静默处理
                this.dashboardStats = null;
            }
        },

        // 保存分组
        async saveGroup() {
            this.$refs.groupForm.validate(async (valid) => {
                if (valid) {
                    // 自动格式化基础URL
                    let apiBaseUrl = this.groupForm.apiBaseUrl;
                    if (apiBaseUrl && typeof apiBaseUrl === 'string') {
                        if (apiBaseUrl.charAt(0) !== '/') {
                            apiBaseUrl = '/' + apiBaseUrl;
                        }
                        if (apiBaseUrl.length > 1 && apiBaseUrl.charAt(apiBaseUrl.length - 1) === '/') {
                            apiBaseUrl = apiBaseUrl.slice(0, -1);
                        }
                        this.groupForm.apiBaseUrl = apiBaseUrl;
                    }

                    try {
                        const url = this.editingGroup ? '/admin/group' : '/admin/group';
                        const method = this.editingGroup ? 'put' : 'post';

                        const response = await axios[method](url, this.groupForm);
                        if (response.data.code === 200) {
                            this.$message.success(this.editingGroup ? '更新成功' : '创建成功');
                            this.showGroupDialog = false;
                            this.resetGroupForm();

                            // 重置并重新加载分组列表
                            this.groupList = [];
                            this.groupListCurrentPage = 1;
                            this.groupListTotal = 0;
                            await this.loadGroupList();
                            await this.loadDashboard();

                            // 重新加载下拉菜单
                            this.loadAllGroupsForDropdown();
                        } else {
                            this.$message.error(response.data.message || '保存失败');
                        }
                    } catch (error) {
                        this.$message.error('操作失败: ' + error.message);
                    }
                }
            });
        },

        // 编辑分组
        editGroup(group) {
            this.editingGroup = group;
            this.groupForm = {...group};
            this.deletePopoverVisible = false; // Reset on edit
            this.showGroupDialog = true;
        },

        // 删除分组
        async deleteGroup(groupId) {
            try {
                if (!groupId) {
                    this.$message.error('分组ID为空');
                    return;
                }
                await this.$confirm('确定要删除这个分组吗？这也会影响到该分组下的API配置。', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                const response = await axios.delete(`/admin/group/${groupId}`);
                if (response.data.code === 200) {
                    this.$message.success('删除成功');
                    this.showGroupDialog = false; // 关闭编辑窗口
                    this.resetGroupForm(); // 重置表单状态

                    // 重置分组列表状态，确保能重新加载
                    this.groupList = [];
                    this.groupListCurrentPage = 1;
                    this.groupListTotal = 0;

                    await this.loadGroupList();
                    await this.loadAllGroupsForDropdown();
                    await this.loadApis(); // Refresh APIs as they might have been affected
                    await this.loadDashboard();
                } else {
                    this.$message.error(response.data.message || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    this.$message.error('删除失败: ' + error.message);
                }
            }
        },

        // 重置API表单
        resetApiForm() {
            this.apiForm = {
                apiConfigId: '', // API配置ID
                apiConfigName: '',
                apiGroupId: '',
                apiUrl: '',
                apiMethod: 'GET',
                statusCode: 200,
                delay: 0,
                response: '',
                comment: '',
                enabled: true,
                template: false, // 控制模板变量替换
                contentType: 'application/json',
                streamEnabled: false // 控制是否启用流式返回
            };
            this.editingApi = null;
            this.$refs.apiForm && this.$refs.apiForm.resetFields();
        },

        // 重置分组表单
        resetGroupForm() {
            this.groupForm = {
                apiGroupId: '',
                apiGroupName: '',
                apiBaseUrl: ''
            };
            this.editingGroup = null;
            this.deletePopoverVisible = false;
            this.$refs.groupForm && this.$refs.groupForm.resetFields();
        },

        // 请求API
        async requestApi(api) {
            try {
                if (!api) {
                    this.$message.error('API对象为空');
                    return;
                }
                if (!api.enabled) {
                    this.$message.warning('该API已禁用，无法请求');
                    return;
                }

                // 构建请求URL：分组的baseUrl + apiUrl
                const apiBaseUrl = api.apiBaseUrl || '';
                const apiUrl = api.apiUrl || '';
                const requestUrl = `/api${apiBaseUrl}${apiUrl}`;
                const apiMethod = api.apiMethod || 'GET';

                // 构建请求头，根据API配置设置Accept头
                const headers = {};
                const isStreamEnabled = api.contentType === 'text/event-stream';
                if (isStreamEnabled) {
                    headers['Accept'] = 'text/event-stream';
                    headers['Cache-Control'] = 'no-cache';
                } else {
                    headers['Accept'] = 'application/json';
                }

                const startTime = Date.now();

                // 对于流式响应，使用特殊处理
                if (isStreamEnabled) {
                    try {
                        // 流式响应会在handleStreamResponse中直接显示弹框和实时更新
                        await this.handleStreamResponse(apiMethod, requestUrl, headers);
                        // 流式响应处理完成，不需要额外操作
                    } catch (error) {
                        // 用户主动中止，则不显示错误弹窗
                        if (error && error.message && error.message.includes('请求被中止')) {
                            return;
                        }

                        // 设置错误响应数据用于弹框显示
                        this.currentResponse = {
                            method: apiMethod,
                            url: requestUrl,
                            status: 0,
                            responseTime: Date.now() - startTime,
                            data: '流式请求失败: ' + error.message,
                            contentType: 'text/plain',
                            isLoading: false,
                            isStreaming: false
                        };
                        // 显示错误响应弹框
                        this.showResponseDialog = true;
                    }
                } else {
                    // 立即弹出响应框并显示加载动画，避免请求期间界面无任何反馈（接口延迟时让用户感知正在请求）
                    // 使用 AbortController 支持加载中关闭弹框时取消请求，避免响应回来后弹框重新打开
                    const abortController = new AbortController();
                    this._pendingResponseAbort = abortController;
                    this.currentResponse = {
                        method: apiMethod,
                        url: requestUrl,
                        status: 0,
                        responseTime: 0,
                        data: '',
                        contentType: api.contentType || 'application/json',
                        isLoading: true,
                        isStreaming: false
                    };
                    this.showResponseDialog = true;

                    const response = await axios({
                        method: apiMethod.toLowerCase(),
                        url: requestUrl,
                        headers: headers,
                        timeout: 10000,
                        signal: abortController.signal
                    });
                    const endTime = Date.now();
                    this._pendingResponseAbort = null;

                    // 设置响应数据用于弹框显示
                    this.currentResponse = {
                        method: apiMethod,
                        url: requestUrl,
                        status: response.status,
                        responseTime: endTime - startTime,
                        data: response.data,
                        contentType: api.contentType || 'application/json',
                        isLoading: false,
                        isStreaming: false
                    };
                }

            } catch (error) {
                this._pendingResponseAbort = null;
                // 用户加载中关闭弹框导致请求被取消，不再弹出错误弹框
                if (error && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError')) {
                    return;
                }
                const endTime = Date.now();
                let errorData = '请求失败: ' + error.message;

                if (error.response) {
                    errorData = error.response.data;
                }

                // 设置错误响应数据用于弹框显示
                this.currentResponse = {
                    method: api.apiMethod || 'GET',
                    url: `${api.apiBaseUrl || ''}${api.apiUrl || ''}`,
                    status: error.response ? error.response.status : 0,
                    responseTime: endTime - Date.now(),
                    data: errorData,
                    contentType: api.contentType || 'application/json',
                    isLoading: false,
                    isStreaming: false
                };

                // 显示响应弹框
                this.showResponseDialog = true;

            }
        },

        // 安全的语法高亮函数
        safeHighlight(content, language = 'plaintext') {
            if (typeof hljs !== 'undefined' && hljs.highlight) {
                try {
                    return hljs.highlight(content, {language: language}).value;
                } catch (error) {
                    return `<pre>${content}</pre>`;
                }
            } else {
                return `<pre>${content}</pre>`;
            }
        },

        // 获取响应内容占位符
        getResponsePlaceholder() {
            if (this.apiForm.streamEnabled) {
                return 'data: {"id": 1, "message": "第一条消息", "timestamp": "${timestamp}"}\n\ndata: {"id": 2, "message": "第二条消息", "timestamp": "${timestamp}"}\n\ndata: [DONE]';
            } else {
                return '请输入响应内容，支持模板语法';
            }
        },

        // 处理WebFlux流式响应
        async handleStreamResponse(method, url, headers) {
            return new Promise((resolve, reject) => {
                // 立即显示响应弹框，准备实时更新
                this.currentResponse = {
                    method: method,
                    url: url,
                    status: 0,
                    responseTime: 0,
                    data: '正在连接...\n',
                    contentType: 'text/event-stream',
                    isStreaming: true
                };
                this.showResponseDialog = true;

                // 关闭上一次未关闭的流式请求，避免连接堆积拖慢服务
                if (this.currentStreamRequest) {
                    if (this.currentStreamRequest.abort) {
                        this.currentStreamRequest.abort(); // AbortController
                    } else if (this.currentStreamRequest.close) {
                        this.currentStreamRequest.close(); // EventSource
                    }
                    this.currentStreamRequest = null;
                }

                const startTime = Date.now();
                let responseData = '';
                let hasReceivedData = false;

                // 对于GET请求，使用EventSource
                if (method.toUpperCase() === 'GET') {
                    const eventSource = new EventSource(url);
                    this.currentStreamRequest = eventSource;

                    eventSource.onopen = (event) => {
                        this.currentResponse.status = 200;
                        this.currentResponse.data = '连接成功，等待数据...\n';
                    };

                    eventSource.onmessage = (event) => {
                        hasReceivedData = true;
                        responseData += event.data + '\n\n';

                        // 直接更新响应数据 - GET请求保持简单
                        this.currentResponse.data = responseData;
                        this.currentResponse.responseTime = Date.now() - startTime;
                    };

                    eventSource.onerror = (event) => {
                        this.currentResponse.isStreaming = false;
                        this.currentStreamRequest = null;
                        eventSource.close();

                        if (hasReceivedData) {
                            // 如果已经收到一些数据，认为部分成功
                            resolve({
                                status: this.currentResponse.status,
                                data: responseData,
                                headers: {}
                            });
                        } else {
                            this.currentResponse.data = '连接失败或连接被关闭';
                            reject(new Error('EventSource连接失败'));
                        }
                    };

                    // 设置超时机制
                    setTimeout(() => {
                        if (this.currentResponse.isStreaming) {
                            this.currentResponse.isStreaming = false;
                            eventSource.close();
                            this.currentStreamRequest = null;

                            if (hasReceivedData) {
                                resolve({
                                    status: this.currentResponse.status,
                                    data: responseData,
                                    headers: {}
                                });
                            } else {
                                this.currentResponse.data += '\n连接超时';
                                resolve({
                                    status: this.currentResponse.status,
                                    data: this.currentResponse.data,
                                    headers: {}
                                });
                            }
                        }
                    }, 30000); // 30秒超时

                } else {
                    // 对于非GET请求，也使用fetch实现流式处理
                    const controller = new AbortController();
                    this.currentStreamRequest = controller;

                    fetch(url, {
                        method: method,
                        headers: {
                            ...headers,
                            'Accept': 'text/event-stream',
                            'Cache-Control': 'no-cache'
                        },
                        signal: controller.signal
                    }).then(response => {
                        this.currentResponse.status = response.status;

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        // 使用ReadableStream处理流式数据
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();

                        const readStream = () => {
                            return reader.read().then(({done, value}) => {
                                if (done) {
                                    this.currentResponse.isStreaming = false;
                                    this.currentStreamRequest = null;
                                    resolve({
                                        status: this.currentResponse.status,
                                        data: responseData,
                                        headers: {}
                                    });
                                    return;
                                }

                                // 将新解码的数据块直接追加到响应数据中，不做任何解析
                                const chunk = decoder.decode(value, {stream: true});
                                responseData += chunk;
                                hasReceivedData = true;

                                // 立即更新UI以显示原始数据
                                this.currentResponse.data = responseData;
                                this.currentResponse.responseTime = Date.now() - startTime;

                                // 继续读取下一块数据
                                return readStream();
                            });
                        };

                        return readStream();

                    }).catch(error => {
                        this.currentResponse.isStreaming = false;
                        this.currentStreamRequest = null;

                        if (error.name === 'AbortError') {
                            this.currentResponse.data = '请求被中止';
                            reject(new Error('请求被中止'));
                        } else {
                            this.currentResponse.data = '请求失败: ' + error.message;
                            reject(error);
                        }
                    });
                }
            });
        },


        // 流式返回开关变化处理
        onStreamEnabledChange(val) {
            // 根据开关状态更新contentType
            this.apiForm.contentType = val ? 'text/event-stream' : 'application/json';
        },

        // 复制响应内容
        copyResponse() {
            if (!this.currentResponse || !this.currentResponse.data) {
                this.$message.error('没有响应内容可复制');
                return;
            }

            try {
                const content = typeof this.currentResponse.data === 'string'
                    ? this.currentResponse.data
                    : JSON.stringify(this.currentResponse.data, null, 2);

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(content).then(() => {
                        this.$message.success('响应内容已复制到剪贴板');
                    }).catch(() => {
                        this.$message.error('复制失败');
                    });
                } else {
                    // 兼容旧浏览器，使用传统方法
                    const input = document.createElement('input');
                    input.value = content;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    this.$message.success('响应内容已复制到剪贴板');
                }
            } catch (error) {
                this.$message.error('复制失败: ' + error.message);
            }
        },

        // 分页处理
        handleCurrentChange(page) {
            this.currentPage = page;
            this.loadApis();
        },

        copyFullUrl() {
            const fullUrl = window.location.origin + (this.currentResponse?.url || '');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(fullUrl).then(() => {
                    this.$message.success('已复制完整URL');
                });
            } else {
                // 兼容旧浏览器
                const input = document.createElement('input');
                input.value = fullUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                this.$message.success('已复制完整URL');
            }
        },

        // 保存为模板
        saveAsTemplate() {
            if (!this.apiForm.templateName.trim()) {
                this.$message.error('请填写模板名称');
                return;
            }

            // 模拟保存模板的API调用
            setTimeout(() => {
                this.$message.success('模板保存成功');
                // 这里可以添加实际的API调用
                // 例如：axios.post('/api/template/save', this.apiForm)
            }, 500);
        },

        // 打开模板选择对话框
        openTemplateDialog() {
            this.templateDialogVisible = true;
            this.loadTemplates();
        },

        // 加载模板列表
        loadTemplates() {
            this.templateLoading = true;
            // 模拟从服务器加载模板列表
            setTimeout(() => {
                // 实际应从服务器获取数据
                this.templateList = [
                    {
                        templateId: 1,
                        templateName: '用户管理模板',
                        templateDescription: '包含用户增删改查的标准接口',
                        apiUrl: '/api/user',
                        apiMethod: 'GET',
                        response: '{"code":200,"message":"success"}',
                        contentType: 'application/json'
                    },
                    {
                        templateId: 2,
                        templateName: '产品详情模板',
                        templateDescription: '产品信息展示接口',
                        apiUrl: '/api/product/detail',
                        apiMethod: 'GET',
                        response: '{"product":{"id":1,"name":"示例产品"}}',
                        contentType: 'application/json'
                    }
                ];
                this.templateLoading = false;
                this.$message.success(`成功加载 ${this.templateList.length} 个模板`);
            }, 800);
        },

        // 应用模板
        applyTemplate(template) {
            // 模拟应用模板的API调用
            setTimeout(() => {
                // 将模板数据应用到当前API表单
                this.apiForm.apiUrl = template.apiUrl;
                this.apiForm.apiMethod = template.apiMethod;
                this.apiForm.response = template.response;
                this.apiForm.comment = template.comment || template.templateDescription;
                this.apiForm.contentType = template.contentType;
                this.apiForm.isTemplate = true;
                this.apiForm.templateName = template.templateName;
                this.apiForm.templateDescription = template.templateDescription;

                this.$message.success('模板应用成功');
                this.templateDialogVisible = false;
                // 这里可以添加实际的API调用
            }, 500);
        },

        // 删除模板
        deleteTemplate() {
            this.$confirm('确定要删除该模板吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 模拟删除模板的API调用
                setTimeout(() => {
                    this.$message.success('模板删除成功');
                    this.apiForm.templateName = '';
                    this.apiForm.templateDescription = '';
                    this.apiForm.isTemplate = false;
                    // 这里可以添加实际的API调用
                }, 500);
            }).catch(() => {
                // 取消删除
            });
        },

        // 删除指定模板
        deleteTemplateById(templateId) {
            this.$confirm('确定要删除该模板吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 模拟删除指定模板
                this.templateList = this.templateList.filter(t => t.templateId !== templateId);
                this.$message.success('模板删除成功');
            }).catch(() => {
                // 取消删除
            });
        },

        // ==================== MoYi 调试模式（纯前端请求） ====================

        // 切换 Mock(YiMo) / 调试(MoYi) 模式
        toggleRequestMode() {
            this.requestMode = !this.requestMode;
            // 持久化当前模式，刷新后保持
            try {
                if (this.requestMode) {
                    localStorage.setItem('yimo-mode', 'moyi');
                } else {
                    localStorage.removeItem('yimo-mode');
                }
            } catch (error) { /* 忽略 */
            }
            // 切换时中止进行中的请求，避免连接残留
            if (!this.requestMode && this.requestAbortController) {
                this.requestAbortController.abort();
                this.requestAbortController = null;
            }
        },

        // ---- Params / Headers 行编辑 ----
        addRequestParam() {
            this.requestParams.push({id: ++this.requestRowSeq, key: '', value: ''});
        },
        removeRequestParam(index) {
            this.requestParams.splice(index, 1);
        },
        addRequestHeader() {
            this.requestHeaders.push({id: ++this.requestRowSeq, key: '', value: ''});
        },
        removeRequestHeader(index) {
            this.requestHeaders.splice(index, 1);
        },

        // 整理请求 URL：将 Params 追加为查询串
        buildRequestUrl() {
            let url = (this.requestUrl || '').trim();
            if (!url) return '';
            const pair = this.requestParams.filter(p => p.key);
            if (pair.length === 0) return url;
            const qs = pair.map(p => encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value || '')).join('&');
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + qs;
        },

        // 整理请求头：非空行 + 自动补充请求体 Content-Type
        buildRequestHeaders() {
            const headers = {};
            this.requestHeaders.forEach(h => {
                const key = (h.key || '').trim();
                if (key) headers[key] = h.value || '';
            });
            if (this.requestHasBody && !headers['Content-Type'] && !headers['content-type'] && this.requestBodyType) {
                headers['Content-Type'] = this.requestBodyType;
            }
            return headers;
        },

        // 格式化请求体为 JSON
        formatRequestBody() {
            if (!this.requestBody.trim()) {
                this.$message.warning('请求体为空');
                return;
            }
            try {
                this.requestBody = JSON.stringify(JSON.parse(this.requestBody), null, 2);
            } catch (error) {
                this.$message.error('请求体不是合法的 JSON：' + error.message);
            }
        },
        // 格式化 Mock 响应内容为缩进 JSON
        formatMockResponse() {
            if (!this.apiForm.response.trim()) {
                this.$message.warning('响应内容为空');
                return;
            }
            try {
                this.apiForm.response = JSON.stringify(JSON.parse(this.apiForm.response), null, 2);
                this.$message.success('已格式化响应内容');
            } catch (error) {
                this.$message.error('响应内容不是合法的 JSON：' + error.message);
            }
        },
        // Mock 表单高亮层与输入框滚动同步
        syncMockFormScroll() {
            const ta = this.$refs.mockFormEditor;
            const pre = this.$refs.mockFormHighlight;
            if (ta && pre) {
                pre.scrollTop = ta.scrollTop;
                pre.scrollLeft = ta.scrollLeft;
            }
        },

        // 发送请求（fetch 浏览器直连，30s 超时）
        async sendRequest() {
            if (this.requestSending) return;
            const url = this.buildRequestUrl();
            if (!url) {
                this.$message.error('请输入请求 URL');
                return;
            }

            // 关闭上一次未完成的请求
            if (this.requestAbortController) {
                this.requestAbortController.abort();
            }
            const controller = new AbortController();
            this.requestAbortController = controller;

            const method = this.requestMethod.trim().toUpperCase();
            const startTime = Date.now();
            this.requestSending = true;
            this.requestResponse = {
                status: 0, statusText: '', responseTime: 0, size: 0,
                text: '', kind: 'is-info', contentType: 'text/plain',
                isLoading: true, isStreaming: false
            };

            try {
                const options = {
                    method: method,
                    headers: this.buildRequestHeaders(),
                    signal: controller.signal
                };
                if (this.requestWithCredentials) {
                    options.credentials = 'include';
                }
                if (this.requestHasBody) {
                    options.body = this.requestBody;
                }

                const timer = setTimeout(() => controller.abort(), 30000);
                const resp = await fetch(url, options);
                clearTimeout(timer);

                const contentType = (resp.headers.get('content-type') || '').split(';')[0] || 'text/plain';
                const fullText = await resp.text();
                const responseTime = Date.now() - startTime;
                const isStreaming = contentType === 'text/event-stream';
                // 超长响应截断展示，避免整页 HTML 等大内容被一次性铺满
                const MAX_SHOW = 200000;
                const text = fullText.length > MAX_SHOW
                    ? fullText.slice(0, MAX_SHOW) + '\n\n... 响应过长（' + fullText.length + ' 字符），已截断展示'
                    : fullText;

                this.requestResponse = {
                    status: resp.status,
                    statusText: resp.statusText || (resp.ok ? 'OK' : 'Error'),
                    responseTime: responseTime,
                    size: new Blob([fullText]).size > 1024
                        ? (new Blob([fullText]).size / 1024).toFixed(2) + ' KB'
                        : new Blob([fullText]).size + ' B',
                    text: text,
                    kind: resp.ok ? 'is-success' : 'is-error',
                    contentType: contentType,
                    isLoading: false,
                    isStreaming: isStreaming
                };
            } catch (error) {
                const responseTime = Date.now() - startTime;
                let message = '';
                if (error && error.name === 'AbortError') {
                    message = '请求超时（30s）或已取消';
                } else if (error instanceof TypeError) {
                    message = '网络错误：无法访问目标地址。若目标接口未开启 CORS，浏览器直连会被拦截，请确认目标服务允许跨域请求。';
                } else {
                    message = '请求失败：' + (error && error.message ? error.message : error);
                }
                this.requestResponse = {
                    status: 0, statusText: 'Error', responseTime: responseTime,
                    size: 0, text: message, kind: 'is-error',
                    contentType: 'text/plain', isLoading: false, isStreaming: false
                };
            } finally {
                this.requestSending = false;
                this.requestAbortController = null;
            }
        },

        // 请求体高亮层与输入框滚动同步
        syncBodyScroll() {
            const ta = this.$refs.bodyEditor;
            const pre = this.$refs.bodyHighlight;
            if (ta && pre) {
                pre.scrollTop = ta.scrollTop;
                pre.scrollLeft = ta.scrollLeft;
            }
        },

        // ---- 复制 / 清空 ----
        copyRequestUrl() {
            const url = this.buildRequestUrl();
            if (!url) {
                this.$message.error('URL 为空');
                return;
            }
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    this.$message.success('URL 已复制');
                }).catch(() => {
                    this.$message.error('复制失败');
                });
            } else {
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                this.$message.success('URL 已复制');
            }
        },
        copyRequestResponse() {
            if (!this.requestResponse || !this.requestResponse.text) {
                this.$message.error('没有响应内容可复制');
                return;
            }
            if (navigator.clipboard) {
                navigator.clipboard.writeText(this.requestResponse.text).then(() => {
                    this.$message.success('响应内容已复制');
                }).catch(() => {
                    this.$message.error('复制失败');
                });
            } else {
                const input = document.createElement('input');
                input.value = this.requestResponse.text;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                this.$message.success('响应内容已复制');
            }
        },
        clearRequestResponse() {
            this.requestResponse = null;
        },

        // ---- 常用请求收藏（localStorage） ----
        loadRequestFavs() {
            try {
                const raw = localStorage.getItem('yimo-fav-urls');
                this.requestFavUrls = raw ? JSON.parse(raw) : [];
            } catch (error) {
                this.requestFavUrls = [];
            }
        },
        saveRequestFavs() {
            try {
                localStorage.setItem('yimo-fav-urls', JSON.stringify(this.requestFavUrls));
            } catch (error) {
                // localStorage 不可用时静默失败
            }
        },
        // 依据 URL 生成默认名称（路径最后一段或域名）
        getFavDefaultName(url) {
            try {
                const u = new URL(url);
                const segs = u.pathname.split('/').filter(Boolean);
                return segs[segs.length - 1] || u.hostname;
            } catch (error) {
                return url;
            }
        },
        saveCurrentToFavs() {
            const url = this.requestUrl.trim();
            if (!url) {
                this.$message.error('URL 为空，无法收藏');
                return;
            }
            const method = this.requestMethod.trim().toUpperCase() || 'GET';
            if (this.requestFavUrls.some(f => f.method === method && f.url === url)) {
                this.$message.warning('该请求已在常用列表中');
                return;
            }
            this.requestFavUrls.unshift({
                id: Date.now() + Math.random(),
                name: this.getFavDefaultName(url),
                method: method,
                url: url
            });
            this.requestFavUrls = this.requestFavUrls.slice(0, 20);
            this.saveRequestFavs();
            this.$message.success('已收藏常用请求');
        },
        removeFavUrl(id) {
            this.requestFavUrls = this.requestFavUrls.filter(f => f.id !== id);
            this.saveRequestFavs();
        },
        restoreFavUrl(fav) {
            if (!fav) return;
            this.requestMethod = fav.method || 'GET';
            this.requestUrl = fav.url || '';
            this.$message.success('已还原常用请求');
        }
    },

    watch: {
        // 监听筛选条件变化
        selectedGroup() {
            if (this._suppressFilterWatch) return;
            this.currentPage = 1;
            this.loadApis();
        },
        selectedMethod() {
            if (this._suppressFilterWatch) return;
            this.currentPage = 1;
            this.loadApis();
        },
        selectedStatus() {
            if (this._suppressFilterWatch) return;
            this.currentPage = 1;
            this.loadApis();
        },
        searchKeyword() {
            if (this._suppressFilterWatch) return;
            this.currentPage = 1;
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadApis();
            }, 300);
        },

        // 监听对话框关闭
        showCreateDialog(val) {
            if (!val) {
                this.resetApiForm();
            }
        },

        showGroupDialog(val) {
            if (!val) {
                this.resetGroupForm();
            }
        },

        // 监听响应弹框关闭
        showResponseDialog(val) {
            if (!val) {
                // 加载中关闭弹框，取消普通（非流式）请求，避免响应回来后弹框重新打开
                if (this._pendingResponseAbort && this.currentResponse && this.currentResponse.isLoading) {
                    this._pendingResponseAbort.abort();
                }
                this._pendingResponseAbort = null;
                // 如果有正在进行的流式请求，中止它
                if (this.currentStreamRequest && this.currentResponse && this.currentResponse.isStreaming) {
                    if (this.currentStreamRequest.abort) {
                        this.currentStreamRequest.abort(); // AbortController
                    } else if (this.currentStreamRequest.close) {
                        this.currentStreamRequest.close(); // EventSource
                    }
                }
                this.currentStreamRequest = null;
            }
        },
    }
}); 