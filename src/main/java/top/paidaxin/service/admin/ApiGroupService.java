package top.paidaxin.service.admin;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.github.pagehelper.PageSerializable;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.paidaxin.controller.vo.Pages;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.ApiGroupDao;
import top.paidaxin.dao.entity.ApiGroup;

import java.util.Date;
import java.util.List;

@Service
public class ApiGroupService implements IApiGroupService {
    @Resource
    private ApiConfigDao apiConfigDao;
    @Resource
    private ApiGroupDao apiGroupDao;

    @Override
    public PageSerializable<ApiGroup> queryGroupList(int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<ApiGroup> list = apiGroupDao.queryGroupConfigByPage();
        return new PageSerializable<>(list);
    }
    
    @Override
    public ApiGroup createGroup(ApiGroup apiGroup) {
        apiGroupDao.insertGroup(apiGroup);
        return apiGroup;
    }
    
    @Override
    public ApiGroup updateGroup(ApiGroup apiGroup) {
        apiGroupDao.updateGroup(apiGroup);
        return apiGroup;
    }
    
    @Override
    @Transactional
    public void deleteGroup(String groupId) {
        apiGroupDao.deleteGroup(groupId);
        apiConfigDao.deleteConfigByGoupId(groupId);
    }
}
