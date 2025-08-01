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
            groupListPageSize: 5,
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
            
            // 表单数据
            apiForm: {
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
                contentType: 'application/json'
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
            
            try {
                // 尝试格式化JSON
                const formatted = JSON.stringify(this.currentResponse.data, null, 2);
                // 使用highlight.js进行语法高亮
                return hljs.highlight(formatted, { language: 'json' }).value;
            } catch (error) {
                // 如果不是JSON，直接返回原始内容
                return this.currentResponse.data;
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
        this.loadData();
    },

    updated() {
        if (this.$refs.groupListContainer && !this.groupListListenerAttached) {
            // 获取实际的DOM元素
            const container = this.$refs.groupListContainer.$el || this.$refs.groupListContainer;
            if (container && container.addEventListener) {
                container.addEventListener('scroll', this.handleGroupListScroll);
                this.groupListListenerAttached = true;
            }
        }
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
            
            // 如果是第一页或者列表为空，直接替换数据；否则追加数据
            const isFirstPage = this.groupListCurrentPage === 1 || this.groupList.length === 0;
            
            this.groupListLoading = true;
            try {
                const response = await axios.get('/admin/group/list', {
                    params: { pageNum: this.groupListCurrentPage, pageSize: this.groupListPageSize }
                });
                if (response.data.code === 200 && response.data.data) {
                    const newData = response.data.data.list || [];
                    
                    // 检查返回的数据是否为空
                    if (newData.length === 0) {
                        this.groupListTotal = this.groupList.length;
                        return;
                    }
                    
                    if (isFirstPage) {
                        // 第一页或重新加载时，替换数据
                        this.groupList = newData;
                    } else {
                        // 后续页面，追加数据
                        this.groupList = this.groupList.concat(newData);
                    }
                    this.groupListTotal = response.data.data.total || 0;
                    this.groupListCurrentPage++;
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
            this.apiForm = { ...api };
            this.showCreateDialog = true;
        },
        
        // 保存API
        async saveApi() {
            try {
                await this.$refs.apiForm.validate();
                
                const url = this.editingApi ? '/admin/config' : '/admin/config';
                const method = this.editingApi ? 'put' : 'post';
                
                const response = await axios[method](url, this.apiForm);
                
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
                    try {
                        const url = this.editingGroup ? '/admin/group' : '/admin/group';
                        const method = this.editingGroup ? 'put' : 'post';
                        
                        const response = await axios[method](url, this.groupForm);
                        if (response.data.code === 200) {
                            this.$message.success(this.editingGroup ? '更新成功' : '创建成功');
                            this.showGroupDialog = false;
                            this.resetGroupForm();
                            
                            // 重置分组列表状态，确保能重新加载
                            if (!this.editingGroup) {
                                this.groupList = [];
                                this.groupListCurrentPage = 1;
                                this.groupListTotal = 0;
                            }
                            
                            this.loadGroupList();
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
                contentType: 'application/json'
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
                
                const startTime = Date.now();
                const response = await axios({
                    method: apiMethod.toLowerCase(),
                    url: requestUrl,
                    timeout: 10000
                });
                const endTime = Date.now();
                
                // 设置响应数据用于弹框显示
                this.currentResponse = {
                    method: apiMethod,
                    url: requestUrl,
                    status: response.status,
                    responseTime: endTime - startTime,
                    data: response.data
                };
                
                // 显示响应弹框
                this.showResponseDialog = true;
                
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
                    data: errorData
                };
                
                // 显示响应弹框
                this.showResponseDialog = true;
                
            }
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
                
                navigator.clipboard.writeText(content).then(() => {
                    this.$message.success('响应内容已复制到剪贴板');
                }).catch(() => {
                    this.$message.error('复制失败');
                });
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
            if (!el) return;
            
            // 获取实际的DOM元素
            const container = el.$el || el;
            if (!container || !container.scrollTop) return;
            
            // 检查是否已经加载完所有数据
            if (this.groupList.length >= this.groupListTotal && this.groupListTotal > 0) return;
            
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            
            // Check if scrolled to the bottom (with a buffer)
            if (distanceToBottom < 50) { // 增加缓冲区，减少触发频率
                // 防抖处理，避免频繁触发
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    this.loadGroupList();
                }, 300); // 增加防抖时间
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
        }
    }
}); 