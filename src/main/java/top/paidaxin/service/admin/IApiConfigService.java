package top.paidaxin.service.admin;

import com.github.pagehelper.PageSerializable;
import top.paidaxin.dao.entity.ApiConfig;

public interface IApiConfigService {
    /**
     * 分页查询API配置列表
     */
    PageSerializable<ApiConfig> queryConfigList(int pageNum, int pageSize, String groupName, String apiName, String groupId, boolean status);
    
    /**
     * 创建API配置
     */
    ApiConfig createConfig(ApiConfig apiConfig);
    
    /**
     * 更新API配置
     */
    ApiConfig updateConfig(ApiConfig apiConfig);
    
    /**
     * 删除API配置
     */
    void deleteConfig(String configId);
    
    /**
     * 启用/禁用API配置
     */
    void toggleConfig(String configId);
}
