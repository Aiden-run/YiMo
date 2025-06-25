package top.paidaxin.controller.vo;

import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class HttpResult<T> {
    private int code;
    private String message;
    private T data;

    public static <T> HttpResult<T> success(T data) {
        return new HttpResult<T>().setCode(HttpServletResponse.SC_OK).setMessage("success").setData(data);

    }public static <T> HttpResult<T> success() {
        return new HttpResult<T>().setCode(HttpServletResponse.SC_OK).setMessage("success").setData(null);
    }

    public static <T> HttpResult<T> fail(String message) {
        return new HttpResult<T>().setCode(HttpServletResponse.SC_INTERNAL_SERVER_ERROR).setMessage(message).setData(null);
    }
}
