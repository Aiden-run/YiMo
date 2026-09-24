package top.paidaxin.dao;

import org.apache.ibatis.annotations.Param;
import top.paidaxin.dao.entity.ApiConfig;

import java.util.List;

public interface ApiConfigDao {
    ApiConfig queryApiConfig(@Param("apiUrl") String apiUrl, @Param("method") String method);

    List<ApiConfig> queryConfigList(@Param("groupId") String groupId,
                                    @Param("apiName") String apiName,
                                    @Param("method") String method,
                                    @Param("status") Boolean status);

    /**
     * API 总数（数据看板用）
     */
    long countConfigs();

    /**
     * 已配置的全部请求方法（去重，供前端方法筛选下拉动态生成）
     */
    List<String> queryDistinctMethods();

    void insertConfig(ApiConfig apiConfig);

    void updateConfig(ApiConfig apiConfig);

    void deleteConfig(@Param("configId") String configId);

    void deleteConfigByGoupId(@Param("configId") String configId);

    ApiConfig queryConfigById(@Param("configId") String configId);

    ApiConfig queryConfigByApiUrl(@Param("groupId") String groupId, @Param("apiUrl") String apiUrl);
}
