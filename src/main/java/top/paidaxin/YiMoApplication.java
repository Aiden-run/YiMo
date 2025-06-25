package top.paidaxin;

import org.h2.tools.Server;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.HashSet;

@SpringBootApplication
@MapperScan("top.paidaxin.dao")
public class YiMoApplication {
    public static void main(String[] args) throws SQLException {
        Server server = Server.createTcpServer(
                "-tcp",              // 启动 TCP 模式
                "-tcpAllowOthers",  // 允许外部连接（默认只允许本机）
                "-tcpPort", "9092"  // 指定端口
        ).start();

        SpringApplication.run(YiMoApplication.class, args);
    }
}