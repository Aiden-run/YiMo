// Vue应用实例
new Vue({
    el: '#app',
    data() {
        return {
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
            
            // 对话框控制
            showCreateDialog: false,
            showGroupDialog: false,
            showResponseDialog: false,
            editingApi: null,
            editingGroup: null,
            deletePopoverVisible: false,
            
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
            return this.apis || [];
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

    updated() {
        if (this.$refs.groupListContainer && !this.groupListListenerAttached) {
            this.$refs.groupListContainer.addEventListener('scroll', this.handleGroupListScroll);
            this.groupListListenerAttached = true;
        }
    },

    beforeDestroy() {
        if (this.$refs.groupListContainer) {
            this.$refs.groupListContainer.removeEventListener('scroll', this.handleGroupListScroll);
        }
    },
    
    methods: {
        async fetchGitHubStars() {
            try {
                const response = await axios.get('https://api.github.com/repos/Aiden-run/YiMo');
                if (response.data && response.data.stargazers_count !== undefined) {
                    document.getElementById('github-stars').textContent = `Star ${response.data.stargazers_count}`;
                }
            } catch (error) {
                console.error('Failed to fetch GitHub stars:', error);
                // Keep default text if API fails
            }
        },

        // 加载数据
        async loadData() {
            this.loading = true;
            // Reset group list state before loading
            this.groupList = [];
            this.groupListCurrentPage = 1;
            this.groupListTotal = 0;
            try {
                await Promise.all([
                    this.loadGroupList(), // Load paginated list for management view
                    this.loadAllGroupsForDropdown(), // Load all groups for select dropdowns
                    this.loadApis(),
                    this.fetchGitHubStars() // Fetch stars on load
                ]);
            } catch (error) {
                this.$message.error('加载数据失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // Load paginated list of groups for the management card
        async loadGroupList() {
            if (this.groupListLoading || (this.groupList.length > 0 && this.groupList.length >= this.groupListTotal)) {
                return;
            }
            
            this.groupListLoading = true;
            try {
                const response = await axios.get('/admin/group/list', {
                    params: { pageNum: this.groupListCurrentPage, pageSize: this.groupListPageSize }
                });
                if (response.data.code === 200 && response.data.data) {
                    this.groupList = this.groupList.concat(response.data.data.list || []);
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
        
        // 加载API列表
        async loadApis() {
            this.loading = true;
            try {
                const response = await axios.get('/admin/config/list', {
                    params: {
                        pageNum: this.currentPage,
                        pageSize: this.pageSize,
                        groupName: this.selectedGroup || undefined,
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
            } finally {
                this.loading = false;
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
                
                const response = await axios.delete(`/admin/group/${groupId}`);
                
                this.deletePopoverVisible = false; // Hide popover

                if (response.data.code === 200) {
                    this.$message.success('删除分组成功');
                    this.showGroupDialog = false; // Close dialog
                    this.loadData(); // Reload all data
                } else {
                    this.$message.error(response.data.message || '删除失败');
                }
            } catch (error) {
                this.deletePopoverVisible = false; // Hide popover on error
                this.$message.error('删除失败: ' + error.message);
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
        },
        
        // 重置分组表单
        resetGroupForm() {
            this.groupForm = {
                apiGroupName: '',
                apiBaseUrl: ''
            };
            this.editingGroup = null;
            this.deletePopoverVisible = false;
            this.$refs.groupForm && this.$refs.groupForm.resetFields();
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
        
        handleGroupListScroll() {
            const el = this.$refs.groupListContainer;
            if (!el) return;
            // Check if scrolled to the bottom (with a buffer)
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 10) {
                this.loadGroupList();
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