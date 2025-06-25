package top.paidaxin.dao.entity;


import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApiConfig extends ApiGroup implements Serializable {
    /**
     * api配置ID
     */
    private String apiConfigId;
    /**
     * api分组ID
     */
    private String apiGroupId;

    /**
     * api配置名称
     */
    private String apiConfigName;
    /**
     * api接口地址
     */
    private String apiUrl;
    /**
     * api接口描述
     */
    private String comment;
    /**
     * api接口返回数据
     */
    private String response;
    /**
     * api接口请求数据
     */
    private String request;
    /**
     * api接口请求方式
     */
    private String apiMethod;
    private String contentType;
    
    /**
     * HTTP状态码
     */
    private Integer statusCode;
    
    /**
     * 响应延迟(毫秒)
     */
    private Integer delay;
    
    /**
     * 是否启用
     */
    private Boolean enabled;
    
    /**
     * 请求参数匹配条件(JSON格式)
     */
    private String requestMatch;
    
    /**
     * 请求头匹配条件(JSON格式)
     */
    private String headerMatch;
    
    /**
     * 响应头设置(JSON格式)
     */
    private String responseHeaders;
    
    /**
     * 创建时间
     */
    private Date createTime;
    
    /**
     * 更新时间
     */
    private Date updateTime;
}
