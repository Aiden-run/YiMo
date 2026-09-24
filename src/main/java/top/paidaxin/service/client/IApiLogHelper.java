package top.paidaxin.service.client;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import top.paidaxin.common.vo.response.ApiLog;
import top.paidaxin.common.vo.response.DashboardStats;
import top.paidaxin.dao.entity.ApiConfig;

import java.util.List;

@Component
public interface IApiLogHelper {

    /**
     * 记录一条接口调用日志
     *
     * @param durationMs   响应耗时（毫秒），在请求线程内计算
     * @param requestBody  请求体摘要（必须在请求线程内读取，异步线程无法读 InputStream）
     * @param errorMsg     异常/错误信息，无异常为 null
     * @param responseSize 响应大小（字节），流式响应或未知为 -1，在请求线程内按实际响应内容计算
     */
    void record(HttpServletRequest request, HttpServletResponse response, ApiConfig apiConfig, long durationMs, String requestBody, String errorMsg, long responseSize);

    /**
     * 查询全部调用日志 = 数据库已落库数据 + 尚未落库的内存缓存数据
     */
    List<ApiLog> queryApiLogs();

    /**
     * 数据看板聚合：今日总调用 + 分组/方法/接口调用排行
     * = 数据库落库数据 + 尚未落库的内存缓存数据 合并统计（同一把锁下取值，保证总数一致）
     */
    DashboardStats queryDashboardStats();

    /**
     * 清理超过一天（非当天）的过期日志：物理删除数据库数据 + 清理内存缓存（由定时任务调用）
     */
    void cleanExpiredLogs();
}