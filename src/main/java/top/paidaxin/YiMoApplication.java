package top.paidaxin;

import org.h2.tools.Server;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.SQLException;

@SpringBootApplication
@MapperScan("top.paidaxin.dao")
public class YiMoApplication {
    public static void main(String[] args) throws SQLException {
        SpringApplication.run(YiMoApplication.class, args);
    }
}