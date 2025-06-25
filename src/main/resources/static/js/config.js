/**
 * YiMo 全局配置管理
 * 自动从当前页面URL获取配置信息
 */
class YiMoConfig {
    constructor() {
        this.init();
    }

    /**
     * 初始化配置
     */
    init() {
        // 从当前页面URL获取配置
        const currentUrl = window.location;
        this.config = {
            protocol: currentUrl.protocol,
            hostname: currentUrl.hostname,
            port: currentUrl.port,
            pathname: currentUrl.pathname,
            baseUrl: this.getBaseUrl(),
            apiBaseUrl: this.getApiBaseUrl(),
            adminBaseUrl: this.getAdminBaseUrl()
        };
        
        console.log('YiMo配置初始化:', this.config);
        
        // 延迟设置axios配置，确保axios已加载
        setTimeout(() => {
            this.setupAxios();
        }, 100);
    }

    /**
     * 获取基础URL
     */
    getBaseUrl() {
        const currentUrl = window.location;
        return `${currentUrl.protocol}//${currentUrl.host}`;
    }

    /**
     * 获取API基础URL
     */
    getApiBaseUrl() {
        // 如果当前页面在根路径，API也在根路径
        // 如果当前页面在子路径，API也在子路径
        const currentUrl = window.location;
        return currentUrl.pathname.replace(/\/[^\/]*$/, '') || '';
    }

    /**
     * 获取管理接口基础URL
     */
    getAdminBaseUrl() {
        return this.getApiBaseUrl() + '/admin';
    }

    /**
     * 设置axios默认配置
     */
    setupAxios() {
        if (typeof axios !== 'undefined') {
            console.log('设置axios配置...');
            
            // 设置基础URL为空，使用相对路径
            axios.defaults.baseURL = '';
            axios.defaults.timeout = 10000;

            // 请求拦截器
            axios.interceptors.request.use(
                config => {
                    // 确保使用相对路径
                    if (config.url && !config.url.startsWith('http')) {
                        // 如果URL不是以http开头，确保它是相对路径
                        if (!config.url.startsWith('/')) {
                            config.url = '/' + config.url;
                        }
                    }
                    console.log('发送请求:', config.method?.toUpperCase(), config.url);
                    return config;
                },
                error => {
                    return Promise.reject(error);
                }
            );

            // 响应拦截器
            axios.interceptors.response.use(
                response => {
                    console.log('收到响应:', response.status, response.config.url);
                    return response;
                },
                error => {
                    if (error.response) {
                        // 服务器返回错误状态码
                        console.error('API错误:', error.response.status, error.response.data);
                    } else if (error.request) {
                        // 请求发送失败
                        console.error('网络错误:', error.request);
                    } else {
                        // 其他错误
                        console.error('请求错误:', error.message);
                    }
                    return Promise.reject(error);
                }
            );
            
            console.log('axios配置完成');
        } else {
            console.warn('axios未加载，延迟设置配置');
            // 如果axios还没加载，延迟重试
            setTimeout(() => {
                this.setupAxios();
            }, 200);
        }
    }

    /**
     * 获取完整的基础URL
     */
    getBaseUrl() {
        return this.config.baseUrl;
    }

    /**
     * 获取API基础URL
     */
    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }

    /**
     * 获取管理接口基础URL
     */
    getAdminBaseUrl() {
        return this.config.adminBaseUrl;
    }

    /**
     * 获取服务器端口
     */
    getServerPort() {
        return this.config.port;
    }

    /**
     * 构建完整的API URL
     */
    buildApiUrl(path) {
        return this.config.apiBaseUrl + path;
    }

    /**
     * 构建完整的管理接口URL
     */
    buildAdminUrl(path) {
        return this.config.adminBaseUrl + path;
    }

    /**
     * 构建完整的静态资源URL
     */
    buildStaticUrl(path) {
        return this.config.baseUrl + path;
    }

    /**
     * 获取当前配置信息
     */
    getConfig() {
        return this.config;
    }
}

// 创建全局配置实例
window.YiMoConfig = new YiMoConfig(); 