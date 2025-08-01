package top.paidaxin.service.admin;

import jakarta.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import top.paidaxin.dao.H2SystemDao;

import static top.paidaxin.common.vo.constant.YiMoTableNames.API_CONFIG;

/**
 * @author paidaxin
 * @date 2025-08-01:15:19
 * 用来做H2初始化
 */
@Service
public class H2SystemService implements IH2SystemService {
    public static final Logger logger = LoggerFactory.getLogger(H2SystemService.class);
    @Resource
    private H2SystemDao h2SystemDao;

    @Override
    public void upgradeToVersion1_2() {
        //1.判断表中是否存在is_template字段
        boolean exists = h2SystemDao.queryTableHasColumn(API_CONFIG.name(), "IS_TEMPLATE");
        //2.不存在则创建
        if (!exists) {
            h2SystemDao.addColumn(API_CONFIG.name(), "IS_TEMPLATE", "tinyint",0);
            logger.info("✅ 1.2版本更新 兼容完成 ~ ");
        }
    }
}
