package top.paidaxin.service.client;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import top.paidaxin.common.vo.response.ApiLog;
import top.paidaxin.common.vo.response.DashboardStats;
import top.paidaxin.dao.ApiLogDao;
import top.paidaxin.dao.entity.ApiConfig;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.ToLongFunction;
import java.util.stream.Collectors;

@Component
public class ApiLogHelper implements IApiLogHelper {
    /**
     * 请求体采样上限（字节），避免为采集数据拖累接口性能
     */
    private static final int BODY_SAMPLE_LIMIT = 2048;

    /**
     * 接口调用排行展示条数
     */
    private static final int TOP_INTERFACE_LIMIT = 10;

    /**
     * 缓存达到多少条时批量落库
     */
    private static final int CACHE_FLUSH_THRESHOLD = 100;

    /**
     * 空分组名的展示兜底
     */
    private static final String UNGROUPED = "未分组";

    /**
     * 空方法的展示兜底
     */
    private static final String UNKNOWN_METHOD = "-";

    private final List<ApiLog> cache = new ArrayList<>();
    /**
     * 缓存写入/落库与查询共用的锁：保证「落库+清缓存」与「查库+读缓存」原子性，避免并发下重复或遗漏计数
     */
    private final Object lock = new Object();

    @Resource
    private ApiLogDao apiLogDao;

    @Override
    public void record(HttpServletRequest request, HttpServletResponse response, ApiConfig apiConfig,
                       long durationMs, String requestBody, String errorMsg, long responseSize) {

        ApiLog apiLog = new ApiLog()
                .setIp(resolveClientIp(request))
                .setApiMethod(apiConfig.getApiMethod())
                .setApiName(apiConfig.getApiConfigName())
                .setApiUrl(apiConfig.getApiUrl())
                .setGroupName(apiConfig.getApiGroupName())
                .setStatusCode(response.getStatus())
                .setResponseTime(LocalDate.now())
                .setRequestTime(LocalDateTime.now())
                .setDuration(durationMs)
                .setQueryString(truncate(request.getQueryString(), 1024))
                .setRequestBody(requestBody)
                .setRequestType(truncate(request.getContentType(), 128))
                .setUa(truncate(request.getHeader("User-Agent"), 255))
                .setReferer(truncate(request.getHeader("Referer"), 512))
                .setErrorMsg(truncate(errorMsg, 512))
                .setResponseSize(responseSize);

        addApiLog(apiLog);
    }

    /**
     * 读取请求体摘要。必须在请求线程内调用（InputStream 无法跨线程读取），
     * 仅采样小体积文本请求，不可读/超长/失败时返回 null，不影响主流程。
     */
    public static String readRequestBody(HttpServletRequest request) {
        try {
            String contentType = request.getContentType();
            boolean readable = contentType == null
                    || contentType.contains("json") || contentType.contains("text")
                    || contentType.contains("xml") || contentType.contains("x-www-form-urlencoded");
            if (!readable) {
                return null;
            }
            int contentLength = request.getContentLength();
            if (contentLength <= 0 || contentLength > 4096) {
                return null;
            }
            try (InputStream in = request.getInputStream()) {
                byte[] bytes = in.readNBytes(BODY_SAMPLE_LIMIT);
                String text = new String(bytes, StandardCharsets.UTF_8);
                return text.length() > BODY_SAMPLE_LIMIT ? text.substring(0, BODY_SAMPLE_LIMIT) : text;
            }
        } catch (Exception ignored) {
            // 读取失败不影响主流程
            return null;
        }
    }

    @Override
    public List<ApiLog> queryApiLogs() {
        synchronized (lock) {
            List<ApiLog> dbList = apiLogDao.selectApiLogs();

            List<ApiLog> result = new ArrayList<>(dbList.size() + cache.size());
            for (int i = cache.size() - 1; i >= 0; i--) {
                result.add(cache.get(i));
            }
            result.addAll(dbList);
            return result;
        }
    }

    @Override
    public DashboardStats queryDashboardStats() {
        synchronized (lock) {
            // 轻量投影：只取分组字段，避免为统计拉取请求体等大字段
            List<ApiLog> rows = new ArrayList<>(apiLogDao.selectApiLogStats());
            // 未落库的缓存记录并入同一统计口径，保证「库 + 缓存」总数一致
            rows.addAll(cache);

            Map<String, DashboardStats.GroupCallStat> groups = new LinkedHashMap<>();
            Map<String, DashboardStats.MethodCallStat> methods = new LinkedHashMap<>();
            Map<String, DashboardStats.InterfaceCallStat> interfaces = new LinkedHashMap<>();

            // 单次遍历完成 分组 / 方法 / 接口 三类计数
            for (ApiLog row : rows) {
                String group = blankTo(row.getGroupName(), UNGROUPED);
                DashboardStats.GroupCallStat groupStat = groups.computeIfAbsent(group, k -> {
                    DashboardStats.GroupCallStat stat = new DashboardStats.GroupCallStat();
                    stat.setName(k);
                    return stat;
                });
                groupStat.setCount(groupStat.getCount() + 1);

                String method = blankTo(row.getApiMethod(), UNKNOWN_METHOD);
                DashboardStats.MethodCallStat methodStat = methods.computeIfAbsent(method, k -> {
                    DashboardStats.MethodCallStat stat = new DashboardStats.MethodCallStat();
                    stat.setMethod(k);
                    return stat;
                });
                methodStat.setCount(methodStat.getCount() + 1);

                String url = row.getApiUrl() == null ? "" : row.getApiUrl();
                DashboardStats.InterfaceCallStat ifaceStat = interfaces.computeIfAbsent(method + "\u0001" + url, key -> {
                    DashboardStats.InterfaceCallStat stat = new DashboardStats.InterfaceCallStat();
                    stat.setMethod(method);
                    stat.setUrl(url);
                    stat.setName(row.getApiName());
                    return stat;
                });
                ifaceStat.setCount(ifaceStat.getCount() + 1);
            }

            DashboardStats stats = new DashboardStats();
            stats.setTotalCalls(rows.size());
            stats.setGroupCalls(statList(groups.values(), DashboardStats.GroupCallStat::getCount));
            stats.setMethodCalls(statList(methods.values(), DashboardStats.MethodCallStat::getCount));
            stats.setTopInterfaces(statList(interfaces.values(), DashboardStats.InterfaceCallStat::getCount, TOP_INTERFACE_LIMIT));
            return stats;
        }
    }

    @Override
    public void cleanExpiredLogs() {
        synchronized (lock) {
            LocalDate today = LocalDate.now();
            // 物理删除超过一天（非当天）的数据
            apiLogDao.deleteExpiredApiLogs(today);
            // 清理缓存中已过期的记录，避免跨天残留导致计数错误
            cache.removeIf(cached -> cached.getResponseTime() == null || cached.getResponseTime().isBefore(today));
        }
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String proxyIp = request.getHeader("X-Forwarded-For");
        if (proxyIp != null && !proxyIp.isBlank()) {
            return proxyIp.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String truncate(String text, int max) {
        if (text == null || text.length() <= max) {
            return text;
        }
        return text.substring(0, max);
    }

    private static String blankTo(String text, String fallback) {
        return text == null || text.isBlank() ? fallback : text;
    }

    /**
     * 按调用次数降序排列，取前 top 条（top 小于等于 0 表示不限制）
     */
    private static <T> List<T> statList(Collection<T> items, ToLongFunction<T> countGetter, int top) {
        return items.stream()
                .sorted(Comparator.comparingLong(countGetter).reversed())
                .limit(top)
                .collect(Collectors.toList());
    }

    private static <T> List<T> statList(Collection<T> items, ToLongFunction<T> countGetter) {
        return statList(items, countGetter, Integer.MAX_VALUE);
    }

    private void addApiLog(ApiLog apiLog) {
        synchronized (lock) {
            cache.add(apiLog);
            if (cache.size() >= CACHE_FLUSH_THRESHOLD) {
                apiLogDao.saveApiLogs(cache);
                cache.clear();
            }
        }
    }
}