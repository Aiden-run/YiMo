package top.paidaxin.service.admin;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageSerializable;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
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
    public PageSerializable<ApiConfig> queryConfigList(int pageNum, int pageSize, String groupId, String apiName, String method, boolean status) {
        PageHelper.startPage(pageNum, pageSize);
        List<ApiConfig> list = apiConfigDao.queryConfigList(groupId,apiName,method,status);
        return new PageSerializable<>(list);
    }
    
    @Override
    public ApiConfig createConfig(ApiConfig apiConfig) {
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
