package top.paidaxin.service.client;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.entity.ApiConfig;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class YiMoApiService implements IYiMoApiService {
    @Resource
    private ApiConfigDao apiConfigDao;

    @Override
    public ApiConfig queryApiConfigByApiUrl(String apiUrl, String method, String queryString, String requestBody) {
        List<ApiConfig> candidates = apiConfigDao.queryApiConfigCandidates(apiUrl, method);
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        Map<String, Object> actualParams = extractActualParams(method, queryString, requestBody);
        for (ApiConfig candidate : candidates) {
            // 优先使用 routesConfig（多路由模式）
            if (StringUtils.hasText(candidate.getRoutesConfig())) {
                ApiConfig matched = matchRoute(candidate, actualParams);
                if (matched != null) {
                    return matched;
                }
                // 无路由命中时返回默认响应（顶层字段）
                return candidate;
            }
            // 回退：旧版 requestMatch 匹配
            if (isMatch(candidate.getRequestMatch(), actualParams)) {
                return candidate;
            }
        }
        return candidates.stream().filter(config -> !StringUtils.hasText(config.getRequestMatch()) && !StringUtils.hasText(config.getRoutesConfig())).findFirst().orElse(null);
    }

    /**
     * 遍历 routesConfig 中的路由，找到第一个匹配的，将 route 的 response/statusCode/delay 覆盖到 candidate 上返回
     * 无匹配时返回 null，调用方使用顶层字段作为默认响应
     */
    private ApiConfig matchRoute(ApiConfig candidate, Map<String, Object> actualParams) {
        try {
            List<Map<String, Object>> routes = top.paidaxin.common.utils.JacksonUtils.json2Object(
                    candidate.getRoutesConfig(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
            if (routes == null) return null;
            for (Map<String, Object> route : routes) {
                Object condObj = route.get("condition");
                if (condObj instanceof Map<?, ?> cond) {
                    if (matchCondition(cond, actualParams)) {
                        // 克隆 candidate，覆盖路由指定的字段
                        ApiConfig result = new ApiConfig();
                        copyCandidateFields(candidate, result);
                        if (route.get("response") != null) result.setResponse(String.valueOf(route.get("response")));
                        if (route.get("statusCode") instanceof Number sc) result.setStatusCode(sc.intValue());
                        if (route.get("delay") instanceof Number d) result.setDelay(d.longValue());
                        if (route.get("contentType") != null) result.setContentType(String.valueOf(route.get("contentType")));
                        return result;
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private boolean matchCondition(Map<?, ?> cond, Map<String, Object> actualParams) {
        if (cond.containsKey("rules")) {
            // GET 风格的 rules 数组: {"rules": [{"key":"a","op":"eq","value":"1"}]}
            Object rulesObj = cond.get("rules");
            if (rulesObj instanceof List<?> rules) {
                for (Object ruleObj : rules) {
                    if (!(ruleObj instanceof Map<?, ?> ruleMap)) continue;
                    Object k = ruleMap.get("key");
                    Object o = ruleMap.get("op");
                    Object v = ruleMap.get("value");
                    String key = k == null ? "" : String.valueOf(k);
                    String op = o == null ? "eq" : String.valueOf(o);
                    String val = v == null ? "" : String.valueOf(v);
                    String actual = Objects.toString(actualParams.get(key), "");
                    if ("ne".equalsIgnoreCase(op)) {
                        if (val.equals(actual)) return false;
                    } else if (!val.equals(actual)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        // 普通 JSON 对象匹配
        for (Map.Entry<?, ?> entry : cond.entrySet()) {
            Object actual = actualParams.get(String.valueOf(entry.getKey()));
            if (!deepEquals(entry.getValue(), actual)) {
                return false;
            }
        }
        return true;
    }

    private void copyCandidateFields(ApiConfig src, ApiConfig dst) {
        dst.setApiConfigId(src.getApiConfigId());
        dst.setApiGroupId(src.getApiGroupId());
        dst.setApiConfigName(src.getApiConfigName());
        dst.setApiBaseUrl(src.getApiBaseUrl());
        dst.setApiUrl(src.getApiUrl());
        dst.setComment(src.getComment());
        dst.setResponse(src.getResponse());
        dst.setRequest(src.getRequest());
        dst.setApiMethod(src.getApiMethod());
        dst.setContentType(src.getContentType());
        dst.setStatusCode(src.getStatusCode());
        dst.setDelay(src.getDelay());
        dst.setEnabled(src.getEnabled());
        dst.setRequestMatch(src.getRequestMatch());
        dst.setHeaderMatch(src.getHeaderMatch());
        dst.setResponseHeaders(src.getResponseHeaders());
        dst.setRoutesConfig(src.getRoutesConfig());
        dst.setTemplate(src.isTemplate());
        dst.setCreateTime(src.getCreateTime());
        dst.setUpdateTime(src.getUpdateTime());
    }

    private boolean isMatch(String matchRule, Map<String, Object> actualParams) {
        if (!StringUtils.hasText(matchRule)) {
            return true;
        }
        try {
            Map<String, Object> expected = top.paidaxin.common.utils.JacksonUtils.json2Object(matchRule, Map.class);
            if (expected == null || expected.isEmpty()) {
                return true;
            }
            Object rulesObj = expected.get("rules");
            if (rulesObj instanceof List<?> rules) {
                for (Object ruleObj : rules) {
                    if (!(ruleObj instanceof Map<?, ?> ruleMap)) {
                        continue;
                    }
                    Object keyObj = ruleMap.get("key");
                    Object opObj = ruleMap.get("op");
                    Object valueObj = ruleMap.get("value");
                    String key = keyObj == null ? "" : String.valueOf(keyObj);
                    String op = opObj == null ? "eq" : String.valueOf(opObj);
                    String value = valueObj == null ? "" : String.valueOf(valueObj);
                    String actual = Objects.toString(actualParams.get(key), "");
                    if ("ne".equalsIgnoreCase(op)) {
                        if (value.equals(actual)) return false;
                    } else if (!value.equals(actual)) {
                        return false;
                    }
                }
                return true;
            }
            // 普通 JSON 对象匹配：期望字段必须在实际参数中存在且值相等（支持嵌套）
            for (Map.Entry<String, Object> entry : expected.entrySet()) {
                Object actual = actualParams.get(entry.getKey());
                if (!deepEquals(entry.getValue(), actual)) {
                    return false;
                }
            }
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private Map<String, Object> extractActualParams(String method, String queryString, String requestBody) {
        if ("GET".equalsIgnoreCase(method)) {
            return parseQueryString(queryString);
        }
        return parseJsonBody(requestBody);
    }

    private Map<String, Object> parseJsonBody(String requestBody) {
        if (!StringUtils.hasText(requestBody)) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> body = top.paidaxin.common.utils.JacksonUtils.json2Object(requestBody, Map.class);
            return body == null ? Collections.emptyMap() : body;
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }

    private Map<String, Object> parseQueryString(String queryString) {
        if (!StringUtils.hasText(queryString)) {
            return Collections.emptyMap();
        }
        Map<String, Object> params = new LinkedHashMap<>();
        String[] pairs = queryString.split("&");
        for (String pair : pairs) {
            if (!StringUtils.hasText(pair)) continue;
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, value);
        }
        return params;
    }

    /**
     * 深度比较两个值是否相等，通过 Jackson 序列化归一化后比较，支持嵌套对象/数组
     */
    private boolean deepEquals(Object expected, Object actual) {
        if (expected == null && actual == null) return true;
        if (expected == null || actual == null) return false;
        try {
            String expectedJson = top.paidaxin.common.utils.JacksonUtils.object2Json(expected);
            String actualJson = top.paidaxin.common.utils.JacksonUtils.object2Json(actual);
            return expectedJson.equals(actualJson);
        } catch (Exception e) {
            return false;
        }
    }
}
