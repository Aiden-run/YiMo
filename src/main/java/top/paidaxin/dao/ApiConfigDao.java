package top.paidaxin.dao;

import org.apache.ibatis.annotations.Param;
import top.paidaxin.dao.entity.ApiConfig;

import java.util.List;

public interface ApiConfigDao {
    ApiConfig queryApiConfig(@Param("apiUrl") String apiUrl, @Param("method") String method);
    
    List<ApiConfig> queryConfigList(@Param("groupId") String groupId);
    
    void insertConfig(ApiConfig apiConfig);
    
    void updateConfig(ApiConfig apiConfig);
    
    void deleteConfig(@Param("configId") String configId);
    void deleteConfigByGoupId(@Param("configId") String configId);

    ApiConfig queryConfigById(@Param("configId") String configId);
}
