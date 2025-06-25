package top.paidaxin.dao;

import top.paidaxin.dao.entity.ApiGroup;

import java.util.List;

public interface ApiGroupDao {
    List<ApiGroup> queryGroupConfigByPage();
    
    void insertGroup(ApiGroup apiGroup);
    
    void updateGroup(ApiGroup apiGroup);
    
    void deleteGroup(String groupId);
}
