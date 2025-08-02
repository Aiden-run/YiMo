package top.paidaxin.common.config.H2Config;

import lombok.SneakyThrows;
import org.h2.tools.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import top.paidaxin.common.utils.SpringUtils;
import top.paidaxin.service.admin.IH2SystemService;

@Component
@Profile("dev")
public class H2ServerStarter implements InitializingBean {
    public static final Logger logger = LoggerFactory.getLogger(H2ServerStarter.class);

    @SneakyThrows
    @Override
    public void afterPropertiesSet() {
        Server.createTcpServer("-tcp", "-tcpAllowOthers", "-tcpPort", "9092").start();
        logger.info("✅ H2 TCP Server started on port 9092 (dev profile)");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkUpdate() {
        IH2SystemService aClass = SpringUtils.getClass(IH2SystemService.class);
        aClass.upgradeToVersion1_2();
    }
}
