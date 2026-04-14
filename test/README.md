# Bug修复验证说明

## 概述

本文档记录了四个Bug的分析、修复方案和验证步骤。

---

## Bug 1: 表单菜单控制台警告

**问题描述：**
打开表单菜单(/form)时，控制台出现警告：
```
[Vue warn]: Invalid prop: type check failed for prop "value". Expected String, Number, got Boolean with value true.
```

**原因分析：**
在 `src/views/element/form.vue` 中，`el-radio-button` 组件使用了 `label` 属性：
```vue
<el-radio-button label="left">Left</el-radio-button>
```
在 Element Plus 2.x 中，`el-radio-button` 应该使用 `value` 属性，而不是 `label` 属性。`label` 属性是旧版本的写法，新版已废弃。

**修复方案：**
将 `el-radio-button` 的 `label` 属性改为 `value` 属性。

**修复文件：** `src/views/element/form.vue`

**修复前：**
```vue
<el-radio-button label="left">Left</el-radio-button>
<el-radio-button label="right">Right</el-radio-button>
<el-radio-button label="top">Top</el-radio-button>
```

**修复后：**
```vue
<el-radio-button value="left">Left</el-radio-button>
<el-radio-button value="right">Right</el-radio-button>
<el-radio-button value="top">Top</el-radio-button>
```

**验证步骤：**
1. 启动项目 `npm run dev`
2. 登录系统（用户名：admin，密码：123456）
3. 点击左侧菜单"表单"
4. 打开浏览器控制台，确认没有警告信息

---

## Bug 2: 主题颜色刷新后随机丢失

**问题描述：**
选择主题颜色后，刷新页面有时会变回初始颜色。

**原因分析：**
在 `src/App.vue` 中，主题初始化使用了随机判断：
```javascript
if (Math.random() > 0.5) {
    theme.initTheme();
}
```
这导致有50%的概率不会初始化主题，从而丢失已保存的主题设置。

**修复方案：**
移除随机判断，始终调用 `theme.initTheme()` 初始化主题。

**修复文件：** `src/App.vue`

**修复前：**
```javascript
if (Math.random() > 0.5) {
    theme.initTheme();
}
```

**修复后：**
```javascript
theme.initTheme();
```

**验证步骤：**
1. 登录系统
2. 点击右上角主题设置，选择一个新颜色
3. 刷新页面多次（至少5次）
4. 确认主题颜色始终保持在选择的颜色

---

## Bug 3: 表格序号计算错误

**问题描述：**
表格的序号显示不正确，从第二页开始序号有问题。

**原因分析：**
1. 在 `table-custom.vue` 中，使用了自定义 template 来显示序号，与 Element Plus 的 `type="index"` 不兼容
2. Mock 数据只有 4 条记录，但 `page.total = 200`，导致分页与实际数据不一致

**修复方案：**
使用 `el-table-column` 的 `:index` 属性来设置序号计算方法。

**修复文件：** `src/components/table-custom.vue`

**修复前：**
```vue
<el-table-column v-if="item.visible" :prop="item.prop" :label="item.label" :width="item.width"
    :type="item.type" :align="item.align || 'center'">
    <template #default="{ $index }" v-if="item.type === 'index'">
        {{ getIndex($index) }}
    </template>
</el-table-column>
```

**修复后：**
```vue
<el-table-column v-if="item.visible" :prop="item.prop" :label="item.label" :width="item.width"
    :type="item.type" :align="item.align || 'center'" :index="item.type === 'index' ? getIndex : undefined">
    <!-- 移除了 index 类型的自定义 template -->
</el-table-column>
```

**getIndex 方法：**
```javascript
const getIndex = (index: number) => {
    return index + 1 + (currentPage.value - 1) * pageSize.value
}
```

**验证步骤：**
1. 登录系统
2. 点击左侧菜单"基础表格"
3. 查看第一页序号，确认从1开始
4. 翻到第二页，确认序号从11开始（假设每页10条）

**注意：** 
Mock 数据只有 4 条记录，如果需要测试完整的分页效果，需要：
1. 扩展 mock/table.json 中的数据
2. 或者修改 API 返回根据分页参数动态生成数据

---

## Bug 4: 普通用户登录时控制台报错，图表不显示

**问题描述：**
普通用户登录时控制台报错，首页订单动态和品类分布图表不显示。

**原因分析：**
在 `src/store/permiss.ts` 中，state 初始化时访问 localStorage：
```javascript
const username = localStorage.getItem('vuems_name');
return {
    key: (username === 'admin' ? defaultList.admin : defaultList[username as string]) as string[],
    defaultList,
};
```
问题：
1. 当 username 不是 'admin' 时，使用 `defaultList[username as string]`
2. 如果 username 是 null 或其他不存在的用户名，`defaultList[username]` 会返回 undefined
3. 导致 key 变成 undefined，后续权限判断失败

**修复方案：**
添加默认值处理，当用户名不存在于 defaultList 时，使用 user 权限。

**修复文件：** `src/store/permiss.ts`

**修复前：**
```javascript
const username = localStorage.getItem('vuems_name');
return {
    key: (username === 'admin' ? defaultList.admin : defaultList[username as string]) as string[],
    defaultList,
};
```

**修复后：**
```javascript
const username = localStorage.getItem('vuems_name');
return {
    key: (username === 'admin' ? defaultList.admin : defaultList[username as string] || defaultList.user) as string[],
    defaultList,
};
```

**验证步骤：**
1. 使用普通用户登录（用户名：user，密码：123456）
2. 确认控制台没有报错
3. 确认首页图表正常显示

---

## 修复文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/views/element/form.vue` | 修复 el-radio-button 使用 value 属性 |
| `src/App.vue` | 移除主题初始化随机判断 |
| `src/components/table-custom.vue` | 使用 el-table-column 的 :index 属性 |
| `src/store/permiss.ts` | 修复用户权限默认值处理 |

---

## 回归测试建议

1. **功能测试**
   - 测试表单页面的所有表单元素功能正常
   - 测试主题切换功能正常
   - 测试表格分页和序号显示正常
   - 测试不同用户登录后的权限和页面显示正常

2. **控制台检查**
   - 确认所有页面打开时控制台无警告和错误

3. **边界测试**
   - 测试 localStorage 为空时的初始化情况
   - 测试未知用户登录时的权限处理

---

## 测试用例运行

测试用例文件：`test/bug-test-cases.ts`

可以在浏览器控制台中运行测试用例来验证修复效果。
