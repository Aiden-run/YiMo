package top.paidaxin.controller.admin;

import com.github.pagehelper.PageSerializable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import top.paidaxin.controller.vo.HttpResult;
import top.paidaxin.controller.vo.Pages;
import top.paidaxin.dao.entity.ApiConfig;
import top.paidaxin.dao.entity.ApiGroup;
import top.paidaxin.service.admin.ApiConfigService;
import top.paidaxin.service.admin.ApiGroupService;

import java.util.Date;
import java.util.UUID;

/**
 * @author paidaxin
 * @date 2025-06-13:14:36
 */
@Tag(name = "YiMo管理")
@RestController
@RequestMapping("/admin")
public class ApiConfigController {
    @Resource
    private ApiGroupService apiGroupService;
    
    @Resource
    private ApiConfigService apiConfigService;

    @Operation(summary = "查询API分组列表")
    @GetMapping("/group/list")
    public HttpResult<PageSerializable<ApiGroup>> queryGroupList(@RequestParam(defaultValue = "1") int pageNum,
                                                      @RequestParam(defaultValue = "10") int pageSize) {
        return HttpResult.success(apiGroupService.queryGroupList(pageNum, pageSize));
    }
    
    @Operation(summary = "创建API分组")
    @PostMapping("/group")
    public HttpResult<ApiGroup> createGroup(@RequestBody ApiGroup apiGroup) {
        return HttpResult.success(apiGroupService.createGroup(apiGroup));
    }
    
    @Operation(summary = "更新API分组")
    @PutMapping("/group")
    public HttpResult<ApiGroup> updateGroup(@RequestBody ApiGroup apiGroup) {
        return HttpResult.success(apiGroupService.updateGroup(apiGroup));
    }
    
    @Operation(summary = "删除API分组")
    @DeleteMapping("/group/{groupId}")
    public HttpResult<Void> deleteGroup(@PathVariable String groupId) {
        apiGroupService.deleteGroup(groupId);
        return HttpResult.success();
    }
    
    @Operation(summary = "查询API配置列表")
    @GetMapping("/config/list")
    public HttpResult<PageSerializable<ApiConfig>> queryConfigList(@RequestParam(defaultValue = "1") int pageNum,
                                                                   @RequestParam(defaultValue = "10") int pageSize,
                                                                   @RequestParam(required = false) String groupId) {
        return HttpResult.success(apiConfigService.queryConfigList(pageNum, pageSize, groupId));
    }
    
    @Operation(summary = "创建API配置")
    @PostMapping("/config")
    public HttpResult<ApiConfig> createConfig(@RequestBody ApiConfig apiConfig) {
        apiConfig.setApiConfigId(UUID.randomUUID().toString().replace("-", ""));
        apiConfig.setCreateTime(new Date());
        apiConfig.setUpdateTime(new Date());
        if (apiConfig.getEnabled() == null) {
            apiConfig.setEnabled(true);
        }
        if (apiConfig.getStatusCode() == null) {
            apiConfig.setStatusCode(200);
        }
        if (apiConfig.getDelay() == null) {
            apiConfig.setDelay(0);
        }
        return HttpResult.success(apiConfigService.createConfig(apiConfig));
    }
    
    @Operation(summary = "更新API配置")
    @PutMapping("/config")
    public HttpResult<ApiConfig> updateConfig(@RequestBody ApiConfig apiConfig) {
        apiConfig.setUpdateTime(new Date());
        return HttpResult.success(apiConfigService.updateConfig(apiConfig));
    }
    
    @Operation(summary = "删除API配置")
    @DeleteMapping("/config/{configId}")
    public HttpResult<Void> deleteConfig(@PathVariable String configId) {
        apiConfigService.deleteConfig(configId);
        return HttpResult.success();
    }
    
    @Operation(summary = "启用/禁用API配置")
    @PutMapping("/config/{configId}/toggle")
    public HttpResult<Void> toggleConfig(@PathVariable String configId) {
        apiConfigService.toggleConfig(configId);
        return HttpResult.success();
    }
}
