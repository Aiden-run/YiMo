package top.paidaxin.controller.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import org.apache.logging.log4j.util.Strings;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.paidaxin.dao.entity.ApiConfig;
import top.paidaxin.service.client.IYiMoApiService;

import java.util.concurrent.TimeUnit;

@RestController
@Tag(name = "YiMo接口")
@RequestMapping("/api")
public class ApiController {
    public static final String BaseUrl = "/api";
    @Resource
    private IYiMoApiService yiMoApiService;

    @SneakyThrows
    @RequestMapping("/**")
    public Object filterHttpRequest(HttpServletRequest request, HttpServletResponse response) {
        //1.查询数据库配置,是否有配置的mock信息
        String apiUrl = StringUtils.replace(request.getRequestURI(), BaseUrl, Strings.EMPTY);
        String method = request.getMethod();
        ApiConfig apiConfig = yiMoApiService.queryApiConfigByApiUrl(apiUrl, method);

        //2.判断是否有Mock配置
        if (ObjectUtils.isEmpty(apiConfig)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return null;
        }

        //3.设置响应时间
        TimeUnit.MILLISECONDS.sleep(apiConfig.getDelay());

        //4.设置响应头
        response.setHeader("content-type", apiConfig.getContentType());
        response.setStatus(apiConfig.getStatusCode());
        return apiConfig.getResponse();
    }
}
