package top.paidaxin.service.admin;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageSerializable;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import top.paidaxin.common.config.exception.ParamException;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.entity.ApiConfig;

import java.util.List;

/**
 * @author paidaxin
 * @date 2025-06-13:14:37
 */
@Service
public class ApiConfigService implements IApiConfigService {

    @Resource
    private ApiConfigDao apiConfigDao;

    @Override
    public PageSerializable<ApiConfig> queryConfigList(int pageNum, int pageSize, String groupId, String apiName, String method, Boolean status) {
        PageHelper.startPage(pageNum, pageSize);
        List<ApiConfig> list = apiConfigDao.queryConfigList(groupId, apiName, method, status);
        return new PageSerializable<>(list);
    }

    @Override
    public ApiConfig createConfig(ApiConfig apiConfig) {
        // 唯一性检查：同个分组下 URL+Method 必须唯一（多路由通过 routesConfig 配置，不再拆成多条记录）
        // requestMatch 传 null 使 SQL 跳过 requestMatch 匹配条件，仅按 URL+Method+Group 检查
        ApiConfig config = apiConfigDao.queryConfigByApiUrl(apiConfig.getApiGroupId(), apiConfig.getApiUrl(), apiConfig.getApiMethod(), null);
        if (!ObjectUtils.isEmpty(config)) {
            throw new ParamException("已存在相同 URL + 方法的配置，请在该配置中编辑路由规则");
        }

        apiConfigDao.insertConfig(apiConfig);
        return apiConfig;
    }

    @Override
    public ApiConfig updateConfig(ApiConfig apiConfig) {
        apiConfigDao.updateConfig(apiConfig);
        return apiConfig;
    }

    @Override
    public void deleteConfig(String configId) {
        apiConfigDao.deleteConfig(configId);
    }

    @Override
    public void toggleConfig(String configId) {
        ApiConfig config = apiConfigDao.queryConfigById(configId);
        if (config != null) {
            config.setEnabled(!config.getEnabled());
            apiConfigDao.updateConfig(config);
        }
    }
}
