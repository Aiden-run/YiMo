package top.paidaxin.service.client;

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
            if (isMatch(candidate.getRequestMatch(), actualParams)) {
                return candidate;
            }
        }
        return candidates.stream().filter(config -> !StringUtils.hasText(config.getRequestMatch())).findFirst().orElse(null);
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
            for (Map.Entry<String, Object> entry : expected.entrySet()) {
                Object actual = actualParams.get(entry.getKey());
                if (actual == null || !String.valueOf(entry.getValue()).equals(String.valueOf(actual))) {
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
}
