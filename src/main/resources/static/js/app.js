// Vue应用实例
new Vue({
    el: '#app',
    data() {
        return {
            // API列表数据
            apis: [],
            groups: [],
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
            
            // 对话框控制
            showCreateDialog: false,
            showGroupDialog: false,
            showResponseDialog: false,
            editingApi: null,
            editingGroup: null,
            
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
                contentType: 'application/json'
            },
            
            groupForm: {
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
        // 过滤后的API列表
        filteredApis() {
            let result = this.apis || [];
            
            // 关键词搜索
            if (this.searchKeyword) {
                const keyword = this.searchKeyword.toLowerCase();
                result = result.filter(api => {
                    if (!api) return false;
                    const apiConfigName = api.apiConfigName || '';
                    const apiBaseUrl = api.apiBaseUrl || '';
                    const apiUrl = api.apiUrl || '';
                    return apiConfigName.toLowerCase().includes(keyword) ||
                           (apiBaseUrl + apiUrl).toLowerCase().includes(keyword);
                });
            }
            
            // 分组筛选
            if (this.selectedGroup) {
                result = result.filter(api => api && api.apiGroupId === this.selectedGroup);
            }
            
            // 方法筛选
            if (this.selectedMethod) {
                result = result.filter(api => api && api.apiMethod === this.selectedMethod);
            }
            
            // 状态筛选
            if (this.selectedStatus !== '') {
                result = result.filter(api => api && api.enabled === this.selectedStatus);
            }
            
            return result;
        },
        
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
        }
    },
    
    mounted() {
        this.loadData();
    },
    
    methods: {
        // 加载数据
        async loadData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadGroups(),
                    this.loadApis()
                ]);
            } catch (error) {
                this.$message.error('加载数据失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // 加载分组列表
        async loadGroups() {
            try {
                const response = await axios.get('/admin/group/list', {
                    params: { pageNum: 1, pageSize: 1000 }
                });
                if (response.data.code === 200) {
                    this.groups = response.data.data.list || [];
                }
            } catch (error) {
                console.error('加载分组失败:', error);
                this.groups = [];
            }
        },
        
        // 加载API列表
        async loadApis() {
            try {
                const response = await axios.get('/admin/config/list', {
                    params: {
                        pageNum: this.currentPage,
                        pageSize: this.pageSize,
                        groupId: this.selectedGroup || undefined
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
                    this.loadData();
                } else {
                    this.$message.error(response.data.message || '操作失败');
                }
            } catch (error) {
                if (error.response) {
                    this.$message.error('操作失败: ' + error.response.data.message);
                } else {
                    this.$message.error('操作失败: ' + error.message);
                }
            }
        },
        
        // 删除API
        async deleteApi(apiId) {
            try {
                if (!apiId) {
                    this.$message.error('API配置ID为空');
                    return;
                }
                await this.$confirm('确定要删除这个API配置吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                
                const response = await axios.delete(`/admin/config/${apiId}`);
                
                if (response.data.code === 200) {
                    this.$message.success('删除成功');
                    this.loadApis();
                } else {
                    this.$message.error(response.data.message || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    this.$message.error('删除失败: ' + error.message);
                }
            }
        },
        
        // 保存分组
        async saveGroup() {
            try {
                await this.$refs.groupForm.validate();
                
                const url = this.editingGroup ? '/admin/group' : '/admin/group';
                const method = this.editingGroup ? 'put' : 'post';
                
                const response = await axios[method](url, this.groupForm);
                
                if (response.data.code === 200) {
                    this.$message.success(this.editingGroup ? '更新成功' : '创建成功');
                    this.showGroupDialog = false;
                    this.resetGroupForm();
                    this.loadGroups();
                } else {
                    this.$message.error(response.data.message || '操作失败');
                }
            } catch (error) {
                this.$message.error('操作失败: ' + error.message);
            }
        },
        
        // 编辑分组
        editGroup(group) {
            this.editingGroup = group;
            this.groupForm = { ...group };
            this.showGroupDialog = true;
        },
        
        // 删除分组
        async deleteGroup(groupId) {
            try {
                if (!groupId) {
                    this.$message.error('分组ID为空');
                    return;
                }
                await this.$confirm('确定要删除这个分组吗？删除分组会同时删除该分组下的所有API配置。', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                
                const response = await axios.delete(`/admin/group/${groupId}`);
                
                if (response.data.code === 200) {
                    this.$message.success('删除分组成功');
                    this.loadGroups();
                    this.loadApis(); // 重新加载API列表
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
                contentType: 'application/json'
            };
            this.editingApi = null;
            this.$refs.apiForm && this.$refs.apiForm.resetFields();
            this.selectedGroup = '';
            this.selectedMethod = '';
            this.selectedStatus = '';
            this.searchKeyword = '';
        },
        
        // 重置分组表单
        resetGroupForm() {
            this.groupForm = {
                apiGroupName: '',
                apiBaseUrl: ''
            };
            this.editingGroup = null;
            this.$refs.groupForm && this.$refs.groupForm.resetFields();
            this.selectedGroup = '';
            this.selectedMethod = '';
            this.selectedStatus = '';
            this.searchKeyword = '';
        },
        
        // 测试API
        async testApi(api) {
            try {
                if (!api) {
                    this.$message.error('API对象为空');
                    return;
                }
                const apiBaseUrl = api.apiBaseUrl || '';
                const apiUrl = api.apiUrl || '';
                const apiMethod = api.apiMethod || 'GET';
                const url = `${apiBaseUrl}${apiUrl}`;
                const response = await axios({
                    method: apiMethod.toLowerCase(),
                    url: url,
                    timeout: 10000
                });
                
                this.$alert(JSON.stringify(response.data, null, 2), 'API响应', {
                    confirmButtonText: '确定',
                    customClass: 'response-dialog'
                });
            } catch (error) {
                this.$message.error('测试失败: ' + error.message);
            }
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
                
                this.$message.info(`正在请求: ${apiMethod} ${requestUrl}`);
                
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
                
                this.$message.success('请求成功');
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
                
                this.$message.error('请求失败');
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
        
        // 复制API URL
        copyApiUrl(api) {
            if (!api) {
                this.$message.error('API对象为空');
                return;
            }
            const apiBaseUrl = api.apiBaseUrl || '';
            const apiUrl = api.apiUrl || '';
            const url = `${window.location.origin}${apiBaseUrl}${apiUrl}`;
            navigator.clipboard.writeText(url).then(() => {
                this.$message.success('URL已复制到剪贴板');
            }).catch(() => {
                this.$message.error('复制失败');
            });
        },
        
        // 切换API状态
        async toggleApiStatus(api) {
            try {
                if (!api || !api.apiConfigId) {
                    this.$message.error('API配置ID为空');
                    return;
                }
                const response = await axios.put(`/admin/config/${api.apiConfigId}/toggle`);
                
                if (response.data.code === 200) {
                    this.$message.success(api.enabled ? '已禁用' : '已启用');
                    this.loadData();
                } else {
                    this.$message.error(response.data.message || '操作失败');
                }
            } catch (error) {
                this.$message.error('操作失败: ' + error.message);
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
        }
    },
    
    watch: {
        // 监听筛选条件变化
        selectedGroup() {
            this.currentPage = 1;
            this.loadApis();
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