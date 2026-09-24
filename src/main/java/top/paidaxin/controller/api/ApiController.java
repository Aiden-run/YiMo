package top.paidaxin.controller.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import org.apache.logging.log4j.util.Strings;
import org.springframework.http.MediaType;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.paidaxin.dao.entity.ApiConfig;
import top.paidaxin.service.client.ApiLogHelper;
import top.paidaxin.service.client.IYiMoApiService;
import top.paidaxin.service.client.IYiMoResponseTemplate;
import top.paidaxin.service.client.strategy.ResponseStrategyFactory;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ThreadPoolExecutor;

@CrossOrigin(origins = "*")
@RestController
@Tag(name = "YiMo接口")
@RequestMapping("/api")
public class ApiController {
    public static final String BaseUrl = "/api";
    @Resource
    private IYiMoApiService yiMoApiService;

    @Resource
    private IYiMoResponseTemplate yiMoResponseTemplate;

    @Resource
    private ResponseStrategyFactory responseStrategyFactory;
    @Resource
    private ThreadPoolExecutor apiRecordThreadPool;
    @Resource
    private ApiLogHelper apiLogHelper;

    @SneakyThrows
    @RequestMapping(value = "/**", produces = {
            MediaType.APPLICATION_JSON_VALUE,
            MediaType.TEXT_EVENT_STREAM_VALUE
    })
    public Object filterHttpRequest(HttpServletRequest request, HttpServletResponse response) {
        long startTime = System.currentTimeMillis();
        //1.查询数据库配置,是否有配置的mock信息
        String apiUrl = request.getRequestURI().replaceFirst(BaseUrl, Strings.EMPTY);
        String method = request.getMethod();
        ApiConfig apiConfig = yiMoApiService.queryApiConfigByApiUrl(apiUrl, method);

        //2.判断是否有Mock配置
        if (ObjectUtils.isEmpty(apiConfig)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return null;
        }

        Throwable error = null;
        // 实际下发的响应内容（模板处理后），用于估算响应大小；流式响应未知标记 -1
        String responseData = null;
        try {
            //4.处理内置函数
            String result = apiConfig.getResponse();
            if (apiConfig.isTemplate()) result = yiMoResponseTemplate.templateHandle(result);
            responseData = result;

            //5.根据不同的content-type做出不同的返回
            return responseStrategyFactory.handleResponse(response, apiConfig.getStatusCode(), apiConfig.getContentType(), result, apiConfig.getDelay());
        } catch (Throwable t) {
            error = t;
            throw t;
        } finally {
            // 记录调用日志：请求体/响应大小/耗时都需在请求线程内采集（InputStream 与上下文不能跨线程），其余字段在异步线程采集
            String requestBody = ApiLogHelper.readRequestBody(request);
            long durationMs = System.currentTimeMillis() - startTime;
            String errorMsg = error == null ? null : String.valueOf(error);
            boolean streamResp = "text/event-stream".equalsIgnoreCase(apiConfig.getContentType());
            long responseSize = streamResp || responseData == null
                    ? -1
                    : responseData.getBytes(StandardCharsets.UTF_8).length;
            apiRecordThreadPool.execute(() -> apiLogHelper.record(request, response, apiConfig, durationMs, requestBody, errorMsg, responseSize));
        }
    }
}
