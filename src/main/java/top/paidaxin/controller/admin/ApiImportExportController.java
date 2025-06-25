package top.paidaxin.controller.admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import top.paidaxin.controller.vo.HttpResult;
import top.paidaxin.dao.entity.ApiConfig;
import top.paidaxin.service.admin.ApiConfigService;

import java.io.IOException;
import java.util.List;

@Tag(name = "YiMo导入导出")
@RestController
@RequestMapping("/admin/import-export")
public class ApiImportExportController {
    
    @Resource
    private ApiConfigService apiConfigService;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    @Operation(summary = "导出API配置")
    @GetMapping("/export")
    public HttpResult<String> exportConfigs(@RequestParam(required = false) String groupId) {
        try {
            List<ApiConfig> configs = apiConfigService.queryConfigList(1, 1000, groupId).getList();
            String json = objectMapper.writeValueAsString(configs);
            return HttpResult.success(json);
        } catch (Exception e) {
            return HttpResult.fail("导出失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "导入API配置")
    @PostMapping("/import")
    public HttpResult<String> importConfigs(@RequestParam("file") MultipartFile file) {
        try {
            String content = new String(file.getBytes());
            List<ApiConfig> configs = objectMapper.readValue(content, new TypeReference<List<ApiConfig>>() {});
            
            int successCount = 0;
            for (ApiConfig config : configs) {
                try {
                    apiConfigService.createConfig(config);
                    successCount++;
                } catch (Exception e) {
                    // 记录错误但继续处理其他配置
                }
            }
            
            return HttpResult.success("成功导入 " + successCount + " 个配置");
        } catch (IOException e) {
            return HttpResult.fail("导入失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取导入模板")
    @GetMapping("/template")
    public HttpResult<String> getTemplate() {
        try {
            ApiConfig template = new ApiConfig();
            template.setApiConfigName("示例API");
            template.setApiUrl("/example");
            template.setApiMethod("GET");
            template.setContentType("application/json");
            template.setStatusCode(200);
            template.setDelay(0);
            template.setEnabled(true);
            template.setResponse("{\"message\": \"Hello World\", \"timestamp\": \"{{timestamp}}\"}");
            template.setComment("这是一个示例API配置");
            
            String json = objectMapper.writeValueAsString(List.of(template));
            return HttpResult.success(json);
        } catch (Exception e) {
            return HttpResult.fail("获取模板失败: " + e.getMessage());
        }
    }
} 