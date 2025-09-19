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
import top.paidaxin.service.client.strategy.IResponseStrategy;
import top.paidaxin.service.client.IYiMoApiService;
import top.paidaxin.service.client.IYiMoResponseTemplate;
import top.paidaxin.service.client.strategy.ResponseStrategyFactory;

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

    @SneakyThrows
    @RequestMapping(value = "/**", produces = {
            MediaType.APPLICATION_JSON_VALUE,
            MediaType.TEXT_EVENT_STREAM_VALUE
    })
    public Object filterHttpRequest(HttpServletRequest request, HttpServletResponse response) {
        //1.查询数据库配置,是否有配置的mock信息
        String apiUrl = request.getRequestURI().replaceFirst(BaseUrl, Strings.EMPTY);
        String method = request.getMethod();
        ApiConfig apiConfig = yiMoApiService.queryApiConfigByApiUrl(apiUrl, method);

        //2.判断是否有Mock配置
        if (ObjectUtils.isEmpty(apiConfig)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return null;
        }

        //4.处理内置函数
        String result = apiConfig.getResponse();
        if (apiConfig.isTemplate()) result = yiMoResponseTemplate.templateHandle(result);

        //5.根据不同的content-type做出不同的返回
        return responseStrategyFactory.handleResponse(response, apiConfig.getStatusCode(), apiConfig.getContentType(), result, apiConfig.getDelay());
    }
}
