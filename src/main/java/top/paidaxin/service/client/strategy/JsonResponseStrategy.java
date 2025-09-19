package top.paidaxin.service.client.strategy;

import lombok.SneakyThrows;
import org.junit.jupiter.api.Order;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

@Primary
@Order(1)
@Service(MediaType.APPLICATION_JSON_VALUE)
public class JsonResponseStrategy implements IResponseStrategy {
    /**
     * 返回json格式无需特殊处理，直接返回
     *
     * @param data  接口返回值
     * @param delay 睡眠时间
     */
    @Override
    @SneakyThrows
    public Object writeResponse(String data, Long delay) {
        Thread.sleep(delay);
        return data;
    }
}
