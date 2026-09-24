package top.paidaxin.controller.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.paidaxin.common.vo.HttpResult;
import top.paidaxin.common.vo.response.ApiLog;
import top.paidaxin.common.vo.response.DashboardStats;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.ApiGroupDao;
import top.paidaxin.service.client.IApiLogHelper;

import java.util.List;

/**
 * YiMo 调用日志：调用记录 + 今日调用统计
 */
@RestController
@Tag(name = "YiMo调用日志")
@RequestMapping("/api-details")
public class ApiLogController {

    @Resource
    private IApiLogHelper apiLogHelper;

    @Resource
    private ApiConfigDao apiConfigDao;

    @Resource
    private ApiGroupDao apiGroupDao;

    @Operation(summary = "调用日志")
    @GetMapping("/log")
    public List<ApiLog> getApiLogs() {
        return apiLogHelper.queryApiLogs();
    }

    @Operation(summary = "数据看板")
    @GetMapping("/stats")
    public HttpResult<DashboardStats> getStats() {
        // 分组 / API 总数来自配置表；调用排行统计聚合在 helper（数据库 + 缓存）中完成
        DashboardStats stats = apiLogHelper.queryDashboardStats();
        stats.setTotalGroups(apiGroupDao.countGroups());
        stats.setTotalApis(apiConfigDao.countConfigs());
        return HttpResult.success(stats);
    }
}