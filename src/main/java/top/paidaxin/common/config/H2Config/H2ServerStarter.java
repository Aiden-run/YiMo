package top.paidaxin.common.config.H2Config;

import lombok.SneakyThrows;
import org.h2.tools.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

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
}
