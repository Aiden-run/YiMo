package top.paidaxin.common.vo.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

/**
 * @author paidaxin
 * @date 2025-08-01:16:58
 */
@Getter
@AllArgsConstructor
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum YiMoResponseTemplateConstant implements Serializable {
    DATE("${date}", "生成当前时间,例如 2025-06-25 14:09:00"),
    UUID("${uuid}", "生成UUID,例如 f45a3348-b9e9-4b18-836f-9d95808c6bae"),
    OBJECT_ID("${objectId}", "ObjectId是MongoDB数据库的一种唯一ID生成策略，是UUID version1的变种"),
    SNOWFLAKE("${snowflake}", "雪花算法"),
    RANDOM_INT("${randomInt}", "0~10000的随机数");

    private final String code;
    private final String desc;
}
