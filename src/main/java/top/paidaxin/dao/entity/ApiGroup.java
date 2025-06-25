package top.paidaxin.dao.entity;

import lombok.Data;

import java.io.Serializable;

@Data
public class ApiGroup implements Serializable {
    private String apiGroupId;
    private String apiGroupName;
    private String apiBaseUrl;
}
