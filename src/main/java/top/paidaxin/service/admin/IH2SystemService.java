package top.paidaxin.service.admin;

/**
 * @author paidaxin
 * @date 2025-08-01:15:19
 */
public interface IH2SystemService {
    /**
     * 升级1.2版本,config表新增字段 is_template
     * 说明: 支持内置函数
     */
    void upgradeToVersion1_2();
}
