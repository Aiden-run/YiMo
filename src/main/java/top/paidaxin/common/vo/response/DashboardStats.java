package top.paidaxin.common.vo.response;

import lombok.Data;

import java.util.List;

/**
 * 数据看板：分组 / API 总数 + 今日调用统计
 */
@Data
public class DashboardStats {
    /**
     * 分组总数
     */
    private long totalGroups;
    /**
     * API 总数
     */
    private long totalApis;
    /**
     * 今日调用总次数
     */
    private long totalCalls;
    /**
     * 分组调用次数（按次数降序）
     */
    private List<GroupCallStat> groupCalls;
    /**
     * 方法分布（按次数降序）
     */
    private List<MethodCallStat> methodCalls;
    /**
     * 接口调用排行 Top 10（按次数降序）
     */
    private List<InterfaceCallStat> topInterfaces;

    /**
     * 分组调用统计
     */
    @Data
    public static class GroupCallStat {
        private String name;
        private long count;
    }

    /**
     * 方法调用统计
     */
    @Data
    public static class MethodCallStat {
        private String method;
        private long count;
    }

    /**
     * 接口调用排行
     */
    @Data
    public static class InterfaceCallStat {
        private String name;
        private String method;
        private String url;
        private long count;
    }
}