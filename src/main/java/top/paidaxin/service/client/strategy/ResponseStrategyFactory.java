package top.paidaxin.service.client.strategy;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @author paidaxin
 * @date 2025-09-19:09:54
 */
@Service
public class ResponseStrategyFactory {
    @Resource
    private Map<String, IResponseStrategy> responseStrategyMap;

    /**
     * 根据不同的返回类型处理返回
     */
    public Object handleResponse(HttpServletResponse response, Integer statusCode, String contentType, String data, Long delay) {
        response.setStatus(statusCode);
        IResponseStrategy strategyMapOrDefault = responseStrategyMap.getOrDefault(contentType, responseStrategyMap.get(MediaType.APPLICATION_JSON_VALUE));
        return strategyMapOrDefault.writeResponse(data, delay);
    }

}
