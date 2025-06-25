package top.paidaxin.controller.vo;

import com.github.pagehelper.PageInfo;
import com.github.pagehelper.PageSerializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.BeanUtils;

/**
 * @author paidaxin
 * @date 2025-06-13:14:28
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pages<T> extends PageSerializable<T> {
    private int pageNum;
    private int pageSize;
    private int pages;
    private int prePage;
    private int nextPage;

    public static <T> Pages<T> convert(PageInfo<T> pageInfo) {
        Pages<T> pageVo = new Pages<>();
        BeanUtils.copyProperties(pageInfo, pageVo);
        return pageVo;
    }
}
