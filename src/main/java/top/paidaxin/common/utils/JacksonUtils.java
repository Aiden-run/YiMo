package top.paidaxin.common.utils;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.SneakyThrows;

import java.text.SimpleDateFormat;


/**
 * @author Aiden
 * Jackson工具类
 */
public class JacksonUtils {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    public static final String STANDARD_FORMAT = "yyyy-MM-dd HH:mm:ss";

    static {
        //对象的所有字段全部列入
        OBJECT_MAPPER.setSerializationInclusion(JsonInclude.Include.ALWAYS);
        //取消默认转换timestamps形式
        OBJECT_MAPPER.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        //忽略空Bean转json的错误
        OBJECT_MAPPER.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        //所有的日期格式都统一为以下的样式，即yyyy-MM-dd HH:mm:ss
        OBJECT_MAPPER.setDateFormat(new SimpleDateFormat(STANDARD_FORMAT));
        //忽略 在json字符串中存在，但是在java对象中不存在对应属性的情况。防止错误
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    private JacksonUtils() {
    }

    /**
     * JSON序列化
     *
     * @param obj 对象
     * @return String
     */
    @SneakyThrows
    public static String object2Json(Object obj) {
        return OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
    }

    /**
     * json返序列化
     */
    @SneakyThrows
    public static <T> T json2Object(String json, Class<T> clazz) {
        return OBJECT_MAPPER.readValue(json, clazz);
    }

    /**
     * json返序列化
     */
    @SneakyThrows
    public static <T> T json2Object(String json, TypeReference<T> typeReference) {
        return OBJECT_MAPPER.readValue(json, typeReference);
    }

    /**
     * 字符串转换为自定义字段转为list
     */
    @SneakyThrows
    public static <T> T string2Obj(String str, TypeReference<T> typeReference) {
        return (T) (typeReference.getType().equals(String.class) ? str : OBJECT_MAPPER.readValue(str, typeReference));
    }
}
