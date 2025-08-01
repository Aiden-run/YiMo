package top.paidaxin.config.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import top.paidaxin.common.vo.HttpResult;

/**
 * @author paidaxin
 * @date 2025-07-30:11:10
 */
@ControllerAdvice
public class GlobalExceptionHandle {
    public static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandle.class);

    @ResponseBody
    @ExceptionHandler(exception = ParamException.class)
    public HttpResult<Void> paramExceptionHandle(ParamException e) {
        logger.warn("参数异常: {}", e.getMessage());
        return HttpResult.fail(e.getMessage());
    }

    @ResponseBody
    @ExceptionHandler(exception = ServerException.class)
    public HttpResult<Void> serverExceptionHandle(ServerException e) {
        logger.error("参数异常: ", e);
        return HttpResult.fail(e.getMessage());
    }
}
