package top.paidaxin.service.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class MockTemplateService {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Random random = new Random();
    
    /**
     * 处理Mock模板，替换占位符
     */
    public String processTemplate(String template) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        
        // 替换各种占位符
        String result = template;
        
        // 替换UUID
        result = result.replaceAll("\\{\\{uuid\\}\\}", UUID.randomUUID().toString());
        
        // 替换随机数字
        result = replaceRandomNumbers(result);
        
        // 替换随机字符串
        result = replaceRandomStrings(result);
        
        // 替换时间戳
        result = result.replaceAll("\\{\\{timestamp\\}\\}", String.valueOf(System.currentTimeMillis()));
        
        // 替换当前时间
        result = result.replaceAll("\\{\\{now\\}\\}", java.time.LocalDateTime.now().toString());
        
        return result;
    }
    
    /**
     * 替换随机数字占位符
     */
    private String replaceRandomNumbers(String template) {
        Pattern pattern = Pattern.compile("\\{\\{random\\.int\\((\\d+),(\\d+)\\)\\}\\}");
        Matcher matcher = pattern.matcher(template);
        
        while (matcher.find()) {
            int min = Integer.parseInt(matcher.group(1));
            int max = Integer.parseInt(matcher.group(2));
            int randomNum = random.nextInt(max - min + 1) + min;
            template = template.replace(matcher.group(), String.valueOf(randomNum));
        }
        
        return template;
    }
    
    /**
     * 替换随机字符串占位符
     */
    private String replaceRandomStrings(String template) {
        Pattern pattern = Pattern.compile("\\{\\{random\\.string\\((\\d+)\\)\\}\\}");
        Matcher matcher = pattern.matcher(template);
        
        while (matcher.find()) {
            int length = Integer.parseInt(matcher.group(1));
            String randomStr = generateRandomString(length);
            template = template.replace(matcher.group(), randomStr);
        }
        
        return template;
    }
    
    /**
     * 生成随机字符串
     */
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    /**
     * 生成示例Mock数据
     */
    public Map<String, Object> generateSampleData() {
        Map<String, Object> sample = new HashMap<>();
        sample.put("id", "{{uuid}}");
        sample.put("name", "{{random.string(8)}}");
        sample.put("age", "{{random.int(18,65)}}");
        sample.put("email", "{{random.string(10)}}@example.com");
        sample.put("timestamp", "{{timestamp}}");
        sample.put("created_at", "{{now}}");
        return sample;
    }
} 