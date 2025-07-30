package top.paidaxin.config.H2Config;

import lombok.SneakyThrows;
import org.h2.tools.Server;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class H2ServerStarter implements InitializingBean {
    @SneakyThrows
    @Override
    public void afterPropertiesSet() {
        Server.createTcpServer(
                "-tcp",
                "-tcpAllowOthers",
                "-tcpPort", "9092"
        ).start();
        System.out.println("✅ H2 TCP Server started on port 9092 (dev profile)");
    }
}
