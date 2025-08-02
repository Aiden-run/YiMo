package top.paidaxin.common.config.H2Config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import top.paidaxin.common.utils.SpringUtils;
import top.paidaxin.service.admin.IH2SystemService;

/**
 * @author paidaxin
 * @date 2025-08-02:16:33
 */
@Component
public class YiMoSysUpdateConfig {
    @EventListener(ApplicationReadyEvent.class)
    public void checkUpdate() {
        IH2SystemService aClass = SpringUtils.getClass(IH2SystemService.class);
        aClass.upgradeToVersion1_2();
    }
}
