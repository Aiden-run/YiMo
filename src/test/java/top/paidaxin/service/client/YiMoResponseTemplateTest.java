package top.paidaxin.service.client;

import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;
import top.paidaxin.common.vo.enums.YiMoResponseTemplateConstant;

import java.lang.reflect.InvocationTargetException;

@SpringBootTest
class YiMoResponseTemplateTest {
    public static final Logger logger = LoggerFactory.getLogger(YiMoResponseTemplateTest.class);
    @Resource
    private IYiMoResponseTemplate yiMoResponseTemplate;

    @Test
    void templateHandleTest() throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException {
        StringBuilder stringBuilder = new StringBuilder();
        for (YiMoResponseTemplateConstant value : YiMoResponseTemplateConstant.values()) {
            stringBuilder.append(value.getCode());
        }
        String response = yiMoResponseTemplate.templateHandle(stringBuilder.toString());
        logger.info("[模版替换测试]:{}", response);
    }
}