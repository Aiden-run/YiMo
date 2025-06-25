package top.paidaxin.service.client;

import top.paidaxin.dao.entity.ApiConfig;

public interface IYiMoApiService {
    ApiConfig queryApiConfigByApiUrl(String apiUrl, String method);
}
