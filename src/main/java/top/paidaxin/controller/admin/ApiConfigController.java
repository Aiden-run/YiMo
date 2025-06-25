package top.paidaxin.controller.admin;

import com.github.pagehelper.PageSerializable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import top.paidaxin.controller.vo.HttpResult;
import top.paidaxin.dao.entity.ApiConfig;
import top.paidaxin.service.admin.ApiConfigService;

import java.util.Date;
import java.util.UUID;

/**
 * @author paidaxin
 * @date 2025-06-13:14:36
 */
@Tag(name = "YiMo管理")
@RestController
@RequestMapping("/admin/config")
public class ApiConfigController {

    @Resource
    private ApiConfigService apiConfigService;

    @Operation(summary = "查询API配置列表")
    @GetMapping("/list")
    public HttpResult<PageSerializable<ApiConfig>> queryConfigList(@RequestParam(defaultValue = "1") int pageNum,
                                                                   @RequestParam(defaultValue = "10") int pageSize,
                                                                   @RequestParam(required = false) String groupId) {
        return HttpResult.success(apiConfigService.queryConfigList(pageNum, pageSize, groupId));
    }

    @Operation(summary = "创建API配置")
    @PostMapping
    public HttpResult<ApiConfig> createConfig(@RequestBody ApiConfig apiConfig) {
        apiConfig.setApiConfigId(UUID.randomUUID().toString().replace("-", ""));
        return HttpResult.success(apiConfigService.createConfig(apiConfig));
    }

    @Operation(summary = "更新API配置")
    @PutMapping
    public HttpResult<ApiConfig> updateConfig(@RequestBody ApiConfig apiConfig) {
        apiConfig.setUpdateTime(new Date());
        return HttpResult.success(apiConfigService.updateConfig(apiConfig));
    }

    @Operation(summary = "删除API配置")
    @DeleteMapping("/{configId}")
    public HttpResult<Void> deleteConfig(@PathVariable String configId) {
        apiConfigService.deleteConfig(configId);
        return HttpResult.success();
    }

    @Operation(summary = "启用/禁用API配置")
    @PutMapping("/{configId}/toggle")
    public HttpResult<Void> toggleConfig(@PathVariable String configId) {
        apiConfigService.toggleConfig(configId);
        return HttpResult.success();
    }
}
