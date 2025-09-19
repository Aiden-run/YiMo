package top.paidaxin.service.client.strategy;

/**
 * @author paidaxin
 * @date 2025-09-19:09:10
 * YiMo 根据不同的content-type做出不同的返回
 */
public interface  IResponseStrategy {

    /**
     * @param data  接口返回值
     * @param delay 睡眠时间
     */
     Object writeResponse(String data, Long delay);
}
