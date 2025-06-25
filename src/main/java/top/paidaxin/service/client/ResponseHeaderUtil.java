package top.paidaxin.service.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.Map;

@Slf4j
public class ResponseHeaderUtil {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 设置自定义响应头
     */
    public static void setResponseHeaders(HttpServletResponse response, String responseHeaders) {
        if (!StringUtils.hasText(responseHeaders)) {
            return;
        }
        
        try {
            Map<String, String> headers = objectMapper.readValue(responseHeaders, 
                new TypeReference<Map<String, String>>() {});
            
            for (Map.Entry<String, String> header : headers.entrySet()) {
                response.setHeader(header.getKey(), header.getValue());
            }
        } catch (Exception e) {
            log.error("设置响应头失败", e);
        }
    }
} 