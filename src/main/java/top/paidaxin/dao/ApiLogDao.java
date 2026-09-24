package top.paidaxin.dao;

import org.apache.ibatis.annotations.Param;
import top.paidaxin.common.vo.response.ApiLog;

import java.time.LocalDate;
import java.util.List;

public interface ApiLogDao {
    void saveApiLogs(List<ApiLog> apiLogs);

    List<ApiLog> selectApiLogs();

    /**
     * 轻量投影：仅查询统计所需的分组字段（groupName/apiMethod/apiUrl/apiName），
     * 其余返回 null。用于数据看板聚合，避免为统计拉取请求体等大字段
     */
    List<ApiLog> selectApiLogStats();

    /**
     * 删除 expireDate 之前（不含当天）的过期数据
     */
    void deleteExpiredApiLogs(@Param("expireDate") LocalDate expireDate);
}