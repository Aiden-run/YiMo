package top.paidaxin.service.client;

import cn.hutool.core.lang.ObjectId;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.RandomUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import top.paidaxin.common.utils.JacksonUtils;
import top.paidaxin.common.vo.enums.YiMoResponseTemplateConstant;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * @author paidaxin
 * @date 2025-08-01:16:53
 */
@Service
public class YiMoResponseTemplate implements IYiMoResponseTemplate {
    private static final Map<String, Supplier<String>> templateMap = new HashMap<>();

    static {
        templateMap.put(YiMoResponseTemplateConstant.DATE.getCode(), () -> new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        templateMap.put(YiMoResponseTemplateConstant.OBJECT_ID.getCode(), ObjectId::next);
        templateMap.put(YiMoResponseTemplateConstant.SNOWFLAKE.getCode(), () -> IdUtil.getSnowflake().nextIdStr());
        templateMap.put(YiMoResponseTemplateConstant.UUID.getCode(), () -> UUID.randomUUID().toString());
        templateMap.put(YiMoResponseTemplateConstant.RANDOM_INT.getCode(), () -> Integer.toString(RandomUtil.randomInt(10000)));
    }

    @Override
    public String templateHandle(String response) {
        for (Map.Entry<String, Supplier<String>> entry : templateMap.entrySet()) {
            String key = entry.getKey();
            response = response.replace(key, templateMap.get(key).get());
        }
        return response;
    }
}
