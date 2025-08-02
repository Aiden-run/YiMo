package top.paidaxin.service.admin;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageSerializable;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;
import top.paidaxin.common.config.exception.ParamException;
import top.paidaxin.dao.ApiConfigDao;
import top.paidaxin.dao.ApiGroupDao;
import top.paidaxin.dao.entity.ApiGroup;

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
        //1.apiBaseUrl唯一
        ApiGroup group = apiGroupDao.queryGroupByBaseUrl(apiGroup.getApiBaseUrl());
        if (!ObjectUtils.isEmpty(group)) {
            throw new ParamException(group.getApiGroupName() + "已使用相同的URL,请重试");
        }

        //2.唯一则新建
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
