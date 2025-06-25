package top.paidaxin.dao.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApiGroupConfig extends ApiGroup {
    List<ApiConfig> apiConfigs;
}
