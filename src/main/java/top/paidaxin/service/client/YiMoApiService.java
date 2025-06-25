package top.paidaxin.service.client;

import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.entity.ApiConfig;

@Service
public class YiMoApiService implements IYiMoApiService {
    @Resource
    private ApiConfigDao apiConfigDao;

    @Override
    public ApiConfig queryApiConfigByApiUrl(String apiUrl, String method) {
        return apiConfigDao.queryApiConfig(apiUrl,method);
    }
}
