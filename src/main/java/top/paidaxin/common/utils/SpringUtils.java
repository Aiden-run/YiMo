package top.paidaxin.common.utils;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.stereotype.Component;

/**
 * @author paidaxin
 * @date 2025-08-01:15:59
 */
@Component
public class SpringUtils implements BeanFactoryPostProcessor {
    private static ConfigurableListableBeanFactory beanFactory;

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        SpringUtils.beanFactory = beanFactory;
    }

    public static <T> T getClass(String name, Class<T> clazz) {
        return beanFactory.getBean(name, clazz);
    }
    public static <T> T getClass(Class<T> clazz) {
        return beanFactory.getBean(clazz);
    }
}
