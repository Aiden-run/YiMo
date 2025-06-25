package top.paidaxin.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import top.paidaxin.controller.vo.HttpResult;

import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@RestController
public class HealthController {

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public HttpResult<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        health.put("service", "YiMo Mock Service");
        health.put("version", "1.0.0");
        
        return HttpResult.success(health);
    }
} 