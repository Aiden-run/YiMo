package top.paidaxin.dao;

import org.apache.ibatis.annotations.Param;

public interface H2SystemDao {
    boolean queryTableHasColumn(@Param("tableName") String tableName, @Param("column") String column);

    void addColumn(@Param("tableName") String tableName,
                   @Param("column") String column,
                   @Param("type") String type,
                   @Param("default") Object defaultVal);
}
