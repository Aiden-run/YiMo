package top.paidaxin.service.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.Map;

@Slf4j
public class RequestMatcher {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 匹配请求参数
     */
    public static boolean matchRequestParams(HttpServletRequest request, String requestMatch) {
        if (!StringUtils.hasText(requestMatch)) {
            return true;
        }
        
        try {
            Map<String, Object> matchConditions = objectMapper.readValue(requestMatch, new TypeReference<Map<String, Object>>() {});
            
            for (Map.Entry<String, Object> entry : matchConditions.entrySet()) {
                String paramName = entry.getKey();
                Object expectedValue = entry.getValue();
                
                String actualValue = request.getParameter(paramName);
                if (actualValue == null || !actualValue.equals(expectedValue.toString())) {
                    return false;
                }
            }
            return true;
        } catch (IOException e) {
            log.error("解析请求匹配条件失败", e);
            return false;
        }
    }
    
    /**
     * 匹配请求头
     */
    public static boolean matchHeaders(HttpServletRequest request, String headerMatch) {
        if (!StringUtils.hasText(headerMatch)) {
            return true;
        }
        
        try {
            Map<String, Object> matchConditions = objectMapper.readValue(headerMatch, new TypeReference<Map<String, Object>>() {});
            
            for (Map.Entry<String, Object> entry : matchConditions.entrySet()) {
                String headerName = entry.getKey();
                Object expectedValue = entry.getValue();
                
                String actualValue = request.getHeader(headerName);
                if (actualValue == null || !actualValue.equals(expectedValue.toString())) {
                    return false;
                }
            }
            return true;
        } catch (IOException e) {
            log.error("解析请求头匹配条件失败", e);
            return false;
        }
    }
} 