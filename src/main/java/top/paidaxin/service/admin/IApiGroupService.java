package top.paidaxin.service.admin;

import com.github.pagehelper.PageInfo;
import com.github.pagehelper.PageSerializable;
import top.paidaxin.dao.entity.ApiGroup;

public interface IApiGroupService {
    /**
     * 分页查询config配置
     */
    PageSerializable<ApiGroup> queryGroupList(int pageNum, int pageSize);
    
    /**
     * 创建API分组
     */
    ApiGroup createGroup(ApiGroup apiGroup);
    
    /**
     * 更新API分组
     */
    ApiGroup updateGroup(ApiGroup apiGroup);
    
    /**
     * 删除API分组
     */
    void deleteGroup(String groupId);
}
