package top.paidaxin.service.client.strategy;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Order(2)
@Service(MediaType.TEXT_EVENT_STREAM_VALUE)
public class StreamResponseStrategy implements IResponseStrategy {

    /**
     * stream流返回根据回车进行切分
     *
     * @param data  接口返回值
     * @param delay 睡眠时间
     */
    @Override
    public Object writeResponse(String data, Long delay) {
        //1.异常判断
        if (!StringUtils.hasText(data)) return null;

        //2.换行切割data
        List<String> streamData = Arrays.stream(data.split("\n"))
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());

        //3.非阻塞返回
        return Flux.fromIterable(streamData)
                .delayElements(Duration.ofMillis(delay))
                .doOnCancel(() -> log.info("客户端取消连接，流被取消"));
    }
}
