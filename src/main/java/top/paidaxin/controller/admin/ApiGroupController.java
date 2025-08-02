package top.paidaxin.controller.admin;

import com.github.pagehelper.PageSerializable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import top.paidaxin.common.vo.HttpResult;
import top.paidaxin.dao.entity.ApiGroup;
import top.paidaxin.service.admin.ApiGroupService;

/**
 * @author paidaxin
 * @date 2025-06-25:15:07
 */
@Tag(name = "YiMo管理")
@RestController
@RequestMapping("/admin/group")
public class ApiGroupController {
    @Resource
    private ApiGroupService apiGroupService;

    @Operation(summary = "查询API分组列表")
    @GetMapping("/list")
    public HttpResult<PageSerializable<ApiGroup>> queryGroupList(@RequestParam(defaultValue = "1") int pageNum,
                                                                 @RequestParam(defaultValue = "10") int pageSize) {
        return HttpResult.success(apiGroupService.queryGroupList(pageNum, pageSize));
    }

    @Operation(summary = "创建API分组")
    @PostMapping
    public HttpResult<ApiGroup> createGroup(@RequestBody ApiGroup apiGroup) {
        return HttpResult.success(apiGroupService.createGroup(apiGroup));
    }

    @Operation(summary = "更新API分组")
    @PutMapping
    public HttpResult<ApiGroup> updateGroup(@RequestBody ApiGroup apiGroup) {
        return HttpResult.success(apiGroupService.updateGroup(apiGroup));
    }

    @Operation(summary = "删除API分组")
    @DeleteMapping("/{groupId}")
    public HttpResult<Void> deleteGroup(@PathVariable String groupId) {
        apiGroupService.deleteGroup(groupId);
        return HttpResult.success();
    }
}
