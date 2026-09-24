package top.paidaxin.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 调用统计异步记录线程池。
 */
@Configuration
public class ApiRecordThreadPoolConfig {
    private static final int CORE_POOL_SIZE = 1;
    private static final int MAXIMUM_POOL_SIZE = 100;
    private static final int KEEP_ALIVE_TIME = 60;
    private static final int QUEUE_CAPACITY = 1000;

    @Bean("apiRecordThreadPool")
    public ThreadPoolExecutor getThreadPoolExecutor() {
        return new ThreadPoolExecutor(CORE_POOL_SIZE,
                MAXIMUM_POOL_SIZE,
                KEEP_ALIVE_TIME,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(QUEUE_CAPACITY));
    }
}