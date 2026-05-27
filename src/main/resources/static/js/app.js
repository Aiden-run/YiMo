// Vue应用实例
new Vue({
    el: '#app',
    data() {
        return {
            isInitialLoad: true, // 控制首次加载动画
            isRefreshing: false, // 控制刷新按钮状态
            initialLoading: true, // 控制骨架屏
            // 标签页控制
            activeTab: 'api',
            // API列表数据
            apis: [],
            groups: [], // For dropdowns
            groupList: [], // For paginated list
            groupListCurrentPage: 1,
            groupListPageSize: 8, // 改为8
            groupListTotal: 0,
            groupListLoading: false,
            groupListListenerAttached: false,
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
            searchTimeout: null,
            scrollTimeout: null, // 滚动防抖定时器
            
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
                streamEnabled: false, // 控制是否启用流式返回，默认不勾选
                requestMatch: ''
            },
            
            groupForm: {
                apiGroupId: '',
                apiGroupName: '',
                apiBaseUrl: ''
            },
            
            // 表单验证规则
            apiRules: {
                apiConfigName: [
                    { required: true, message: '请输入API名称', trigger: 'blur' }
                ],
                apiGroupId: [
                    { required: true, message: '请选择所属分组', trigger: 'change' }
                ],
                apiUrl: [
                    { required: true, message: '请输入API路径', trigger: 'blur' }
                ],
                apiMethod: [
                    { required: true, message: '请选择请求方法', trigger: 'change' }
                ],
                response: [
                    { required: true, message: '请输入响应内容', trigger: 'blur' }
                ]
            },
            
            groupRules: {
                apiGroupName: [
                    { required: true, message: '请输入分组名称', trigger: 'blur' }
                ],
                apiBaseUrl: [
                    { required: true, message: '请输入基础URL', trigger: 'blur' }
                ]
            }
        }
    },
    
    computed: {
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
                const streamingIndicator = this.currentResponse.isStreaming ? '\n\n⏳ 数据流式传输中...' : '';
                
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
        }
    },
    
    mounted() {
        // 确保highlight.js可用
        if (typeof hljs !== 'undefined') {
            console.log('Highlight.js loaded successfully');
        } else {
            console.warn('Highlight.js not available, using fallback formatting');
        }
        this.loadData();
    },

    updated() {
        // updated钩子仍然作为备用方案
        this.attachScrollListener();
    },

    beforeDestroy() {
        if (this.$refs.groupListContainer) {
            const container = this.$refs.groupListContainer.$el || this.$refs.groupListContainer;
            if (container && container.removeEventListener) {
                container.removeEventListener('scroll', this.handleGroupListScroll);
            }
        }
        // 清理定时器
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    },
    
    methods: {
        attachScrollListener() {
            if (this.$refs.groupListContainer && !this.groupListListenerAttached) {
                // 获取实际的DOM元素
                const container = this.$refs.groupListContainer.$el || this.$refs.groupListContainer;
                console.log('尝试绑定滚动事件监听器，容器:', container);
                if (container && container.addEventListener) {
                    container.addEventListener('scroll', this.handleGroupListScroll);
                    this.groupListListenerAttached = true;
                    console.log('滚动事件监听器绑定成功');
                } else {
                    console.log('容器不支持事件监听');
                }
            }
        },

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
                    this.loadApis() // Load API list
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

            setTimeout(() => {
                this.isRefreshing = false;
            }, 1000);
        },
        
        // Load paginated list of groups for the management card
        async loadGroupList() {
            if (this.groupListLoading) return;
            
            // 检查是否已经加载完所有数据
            if (this.groupList.length >= this.groupListTotal && this.groupListTotal > 0) return;
            
            console.log('开始加载分组列表，当前页:', this.groupListCurrentPage, '每页数量:', this.groupListPageSize);
            
            this.groupListLoading = true;
            try {
                const response = await axios.get('/admin/group/list', {
                    params: { 
                        pageNum: this.groupListCurrentPage, 
                        pageSize: this.groupListPageSize 
                    }
                });
                
                console.log('分组列表响应:', response.data);
                
                if (response.data.code === 200 && response.data.data) {
                    const newData = response.data.data.list || [];
                    const total = response.data.data.total || 0;
                    
                    console.log('获取到新数据:', newData.length, '条，总数:', total);
                    
                    // 检查返回的数据是否为空
                    if (newData.length === 0 && this.groupListCurrentPage > 1) {
                        console.log('没有更多数据了');
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
                    
                    console.log('当前分组列表长度:', this.groupList.length, '下一页:', this.groupListCurrentPage);
                }
            } catch (error) {
                this.$message.error('加载分组列表失败');
                console.error('加载分组列表失败:', error);
            } finally {
                this.groupListLoading = false;
            }
        },

        // Load all groups (up to a limit) for dropdowns
        async loadAllGroupsForDropdown() {
            try {
                const response = await axios.get('/admin/group/list', {
                    params: { pageNum: 1, pageSize: 100 } // Load up to 100 groups for dropdowns
                });
                if (response.data.code === 200) {
                    this.groups = response.data.data.list || [];
                }
            } catch (error) {
                console.error('加载全量分组失败:', error);
                this.groups = [];
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
                console.error('加载API列表失败:', error);
                this.apis = [];
                this.total = 0;
            }
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
                const formData = { ...this.apiForm };
                formData.contentType = formData.streamEnabled ? 'text/event-stream' : 'application/json';
                if (formData.requestMatch && formData.requestMatch.trim()) {
                    JSON.parse(formData.requestMatch);
                    formData.requestMatch = formData.requestMatch.trim();
                } else {
                    formData.requestMatch = '';
                }
                
                const url = this.editingApi ? '/admin/config' : '/admin/config';
                const method = this.editingApi ? 'put' : 'post';
                
                const response = await axios[method](url, formData);
                
                if (response.data.code === 200) {
                    this.$message.success(this.editingApi ? '更新成功' : '创建成功');
                    this.showCreateDialog = false;
                    this.resetApiForm();
                    this.loadApis(); // Only reload the API list
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

        // 保存分组
        async saveGroup() {
            this.$refs.groupForm.validate(async(valid) => {
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
                            this.groupListListenerAttached = false; // 关键：重置监听器标志
                            await this.loadGroupList();
                            
                            // 重新加载下拉菜单并尝试重新附加滚动监听器
                            this.loadAllGroupsForDropdown();
                            this.$nextTick(() => {
                                this.attachScrollListener();
                            });
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
            this.groupForm = { ...group };
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
                streamEnabled: false, // 控制是否启用流式返回
                requestMatch: ''
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
                            console.log('流式请求被用户中止，不显示二次弹窗。');
                            return;
                        }

                        console.error('流式请求失败:', error);
                        // 设置错误响应数据用于弹框显示
                        this.currentResponse = {
                            method: apiMethod,
                            url: requestUrl,
                            status: 0,
                            responseTime: Date.now() - startTime,
                            data: '流式请求失败: ' + error.message,
                            contentType: 'text/plain',
                            isStreaming: false
                        };
                        // 显示错误响应弹框
                        this.showResponseDialog = true;
                    }
                } else {
                const response = await axios({
                    method: apiMethod.toLowerCase(),
                    url: requestUrl,
                        headers: headers,
                    timeout: 10000
                });
                const endTime = Date.now();
                
                // 设置响应数据用于弹框显示
                this.currentResponse = {
                    method: apiMethod,
                    url: requestUrl,
                    status: response.status,
                    responseTime: endTime - startTime,
                        data: response.data,
                        contentType: api.contentType || 'application/json'
                };
                }
                
                // 对于非流式响应，显示响应弹框
                if (!isStreamEnabled) {
                this.showResponseDialog = true;
                }
                
            } catch (error) {
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
                    contentType: api.contentType || 'application/json'
                };
                
                // 显示响应弹框
                this.showResponseDialog = true;
                
            }
        },
        
        // 安全的语法高亮函数
        safeHighlight(content, language = 'plaintext') {
            if (typeof hljs !== 'undefined' && hljs.highlight) {
                try {
                    return hljs.highlight(content, { language: language }).value;
                } catch (error) {
                    console.warn('Highlight.js error:', error);
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
                    console.log('--- [DEBUG] Starting non-GET stream request ---');
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
                        console.log('[DEBUG] Received response from fetch:', response);
                        this.currentResponse.status = response.status;
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        // 使用ReadableStream处理流式数据
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        
                        const readStream = () => {
                            return reader.read().then(({ done, value }) => {
                                if (done) {
                                    console.log('[DEBUG] Stream finished.');
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
                                const chunk = decoder.decode(value, { stream: true });
                                console.log('[DEBUG] Received chunk:', chunk);
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
                        console.error('[DEBUG] Error in fetch stream:', error);
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
        
        handleGroupListScroll() {
            const el = this.$refs.groupListContainer;
            console.log('滚动事件触发，容器引用:', el);
            if (!el) return;
            
            // 获取实际的DOM元素
            const container = el.$el || el;
            console.log('实际容器元素:', container);
            if (!container || typeof container.scrollTop === 'undefined') return;
            
            // 检查是否已经加载完所有数据
            if (this.groupList.length >= this.groupListTotal && this.groupListTotal > 0) {
                console.log('已加载完所有数据，停止滚动加载');
                return;
            }
            
            // 如果正在加载中，避免重复触发
            if (this.groupListLoading) {
                console.log('正在加载中，跳过本次滚动事件');
                return;
            }
            
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            
            console.log('滚动信息:', {
                scrollTop,
                scrollHeight,
                clientHeight,
                distanceToBottom
            });
            
            // Check if scrolled to the bottom (with a buffer)
            if (distanceToBottom < 20) { // 减少缓冲区，提高触发灵敏度
                console.log('接近底部，准备加载更多数据');
                // 防抖处理，避免频繁触发
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    console.log('触发滚动加载，当前页:', this.groupListCurrentPage);
                    this.loadGroupList();
                }, 100); // 减少防抖时间，提高响应速度
            }
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
        }
    },
    
    watch: {
        // 监听筛选条件变化
        selectedGroup() {
            this.currentPage = 1;
            this.loadApis();
        },
        selectedMethod() {
            this.currentPage = 1;
            this.loadApis();
        },
        selectedStatus() {
            this.currentPage = 1;
            this.loadApis();
        },
        searchKeyword() {
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
                // 如果有正在进行的流式请求，中止它
                if (this.currentStreamRequest && this.currentResponse && this.currentResponse.isStreaming) {
                    console.log('用户关闭弹框，中止流式请求');
                    if (this.currentStreamRequest.abort) {
                        this.currentStreamRequest.abort(); // AbortController
                    } else if (this.currentStreamRequest.close) {
                        this.currentStreamRequest.close(); // EventSource
                    }
                }
                this.currentStreamRequest = null;
            }
        },
        
        // 监听流式返回开关 - 确保占位符更新
        'apiForm.streamEnabled'(val) {
            // 这个监听器主要用于触发计算属性更新，如getResponsePlaceholder
        },
        
        // 监听模板变量开关
        'apiForm.template'(val) {
            console.log('template变化:', val);
        }
    }
}); 
