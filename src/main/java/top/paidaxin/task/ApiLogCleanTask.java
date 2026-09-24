package top.paidaxin.task;

import jakarta.annotation.Resource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import top.paidaxin.service.client.IApiLogHelper;

/**
 * 调用日志定时清理任务：
 * 每小时执行一次，物理删除超过一天（非当天）的过期日志，
 * 同时清理内存缓存中的过期记录。
 */
@Component
public class ApiLogCleanTask {

    @Resource
    private IApiLogHelper apiLogHelper;

    @Scheduled(cron = "0 0 * * * ?")
    public void cleanExpiredLogs() {
        apiLogHelper.cleanExpiredLogs();
    }
}