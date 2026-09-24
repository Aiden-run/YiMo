package top.paidaxin.common.vo.response;

import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
public class ApiLog {
    private String ip;
    private String groupName;
    private String apiUrl;
    private String apiMethod;
    private String apiName;
    private int statusCode;
    private LocalDate responseTime;
    /**
     * 精确调用时间
     */
    private LocalDateTime requestTime;
    /**
     * 响应耗时（毫秒），-1 表示未知
     */
    private long duration;
    /**
     * 请求 query string
     */
    private String queryString;
    /**
     * 请求体摘要（超长截断）
     */
    private String requestBody;
    /**
     * 请求 Content-Type
     */
    private String requestType;
    /**
     * 响应体大小（字节），-1 表示未知（如流式）
     */
    private long responseSize;
    /**
     * 调用方 User-Agent
     */
    private String ua;
    /**
     * 调用来源页
     */
    private String referer;
    /**
     * 异常/错误信息
     */
    private String errorMsg;
}