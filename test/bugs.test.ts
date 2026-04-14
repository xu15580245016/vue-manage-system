/**
 * Bug 复现测试用例
 * 
 * 本测试文件用于复现以下Bug：
 * 1. 表单菜单控制台警告 - el-radio 使用了 label 而不是 value
 * 2. 主题颜色刷新后变回初始颜色 - initTheme 未被调用
 * 3. 表格序号不对 - getIndex 计算错误
 * 4. 普通用户登录时报错 - permiss.key 可能为 undefined
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== Bug 1: 表单菜单控制台警告 ====================
// 问题：el-radio 和 el-checkbox 组件使用了 label 属性，但 Element Plus 2.x 应该使用 value
describe('Bug 1: 表单菜单控制台警告', () => {
    it('应该检查 el-radio 使用 value 而不是 label', () => {
        // 读取 form.vue 文件内容
        const fs = require('fs');
        const path = require('path');
        const formVuePath = path.join(__dirname, '../src/views/element/form.vue');
        const content = fs.readFileSync(formVuePath, 'utf-8');

        // 检查是否存在 label 属性（这是错误的用法）
        const hasLabelAttr = /<el-radio[^>]*label=/.test(content);

        // 这个测试应该失败，因为当前代码使用了 label
        // 修复后应该使用 value 属性
        expect(hasLabelAttr).toBe(false);
    });

    it('应该检查 el-checkbox 使用 value 而不是 label', () => {
        // 读取 form.vue 文件内容
        const fs = require('fs');
        const path = require('path');
        const formVuePath = path.join(__dirname, '../src/views/element/form.vue');
        const content = fs.readFileSync(formVuePath, 'utf-8');

        // 检查 el-checkbox 是否存在 label 属性（这是错误的用法）
        const hasLabelAttr = /<el-checkbox[^>]*label=/.test(content);

        // 修复后应该使用 value 属性
        expect(hasLabelAttr).toBe(false);
    });
});

// ==================== Bug 2: 主题颜色刷新后变回初始颜色 ====================
// 问题：initTheme 方法在应用启动时没有被调用
describe('Bug 2: 主题颜色刷新后变回初始颜色', () => {
    it('应该在 main.ts 中调用 themeStore.initTheme()', () => {
        const fs = require('fs');
        const path = require('path');
        const mainTsPath = path.join(__dirname, '../src/main.ts');
        const content = fs.readFileSync(mainTsPath, 'utf-8');

        // 检查是否调用了 initTheme
        const hasInitTheme = content.includes('initTheme()');

        // 这个测试应该失败，因为当前代码没有调用 initTheme
        expect(hasInitTheme).toBe(true);
    });
});

// ==================== Bug 3: 表格序号不对 ====================
// 问题：getIndex 方法计算错误，应该是 (currentPage - 1) * pageSize
describe('Bug 3: 表格序号不对', () => {
    it('getIndex 应该正确计算序号', () => {
        // 模拟 getIndex 函数
        const getIndexWrong = (index: number, currentPage: number, pageSize: number) => {
            return index + 1 + currentPage * pageSize; // 错误的实现
        };

        const getIndexCorrect = (index: number, currentPage: number, pageSize: number) => {
            return index + 1 + (currentPage - 1) * pageSize; // 正确的实现
        };

        // 测试第2页，每页10条，第0条数据的序号
        // 正确结果应该是 11 (第2页第1条)
        // 错误结果是 21
        expect(getIndexWrong(0, 2, 10)).toBe(21); // 当前错误的实现
        expect(getIndexCorrect(0, 2, 10)).toBe(11); // 正确的实现

        // 验证修复后的实现
        expect(getIndexCorrect(0, 2, 10)).toBe(11);
        expect(getIndexCorrect(5, 3, 10)).toBe(26); // 第3页第6条应该是 26
    });

    it('table-custom.vue 中的 getIndex 实现应该正确', () => {
        const fs = require('fs');
        const path = require('path');
        const tableCustomPath = path.join(__dirname, '../src/components/table-custom.vue');
        const content = fs.readFileSync(tableCustomPath, 'utf-8');

        // 检查 getIndex 实现
        const getIndexMatch = content.match(/const getIndex = \(index: number\) => \{[^}]+\}/);
        expect(getIndexMatch).toBeTruthy();

        const getIndexImpl = getIndexMatch![0];
        // 应该包含 (currentPage.value - 1) 而不是 currentPage.value
        const hasCorrectFormula = getIndexImpl.includes('(currentPage.value - 1)');
        expect(hasCorrectFormula).toBe(true);
    });
});

// ==================== Bug 4: 普通用户登录时报错 ====================
// 问题：当用户不是 admin 时，defaultList[username] 可能为 undefined
describe('Bug 4: 普通用户登录时报错', () => {
    it('permiss.key 应该始终返回数组', () => {
        // 模拟 permiss store 的 state 逻辑
        const defaultList: Record<string, string[]> = {
            admin: ['0', '1', '11', '12'],
            user: ['0', '1', '11', '12', '13'],
        };

        // 模拟获取 username
        const getPermissKey = (username: string | null) => {
            // 当前有问题的实现
            return username === 'admin' ? defaultList.admin : defaultList[username as string];
        };

        // 测试 admin 用户
        expect(getPermissKey('admin')).toEqual(['0', '1', '11', '12']);

        // 测试普通 user 用户
        expect(getPermissKey('user')).toEqual(['0', '1', '11', '12', '13']);

        // 测试未知用户（这是问题所在！）
        // 当前实现会返回 undefined
        expect(getPermissKey('unknown')).toBeUndefined();
        expect(getPermissKey(null)).toBeUndefined();

        // 正确的实现应该返回空数组或默认权限
        const getPermissKeyFixed = (username: string | null) => {
            if (username === 'admin') {
                return defaultList.admin;
            }
            return defaultList[username as string] || defaultList.user;
        };

        expect(getPermissKeyFixed('unknown')).toEqual(['0', '1', '11', '12', '13']);
        expect(getPermissKeyFixed(null)).toEqual(['0', '1', '11', '12', '13']);
    });

    it('permiss.ts 应该正确处理未知用户', () => {
        const fs = require('fs');
        const path = require('path');
        const permissPath = path.join(__dirname, '../src/store/permiss.ts');
        const content = fs.readFileSync(permissPath, 'utf-8');

        // 检查是否有兜底逻辑
        const hasFallback = content.includes('|| defaultList.user') ||
            content.includes('?? defaultList.user');
        expect(hasFallback).toBe(true);
    });
});

// ==================== 集成测试 ====================
describe('集成测试：所有 Bug 修复验证', () => {
    it('所有 Bug 应该被修复', () => {
        const fs = require('fs');
        const path = require('path');

        // Bug 1: 检查 form.vue
        const formVuePath = path.join(__dirname, '../src/views/element/form.vue');
        const formContent = fs.readFileSync(formVuePath, 'utf-8');
        const bug1Fixed = !/<el-radio[^>]*label=/.test(formContent);

        // Bug 2: 检查 main.ts
        const mainTsPath = path.join(__dirname, '../src/main.ts');
        const mainContent = fs.readFileSync(mainTsPath, 'utf-8');
        const bug2Fixed = mainContent.includes('initTheme()');

        // Bug 3: 检查 table-custom.vue
        const tableCustomPath = path.join(__dirname, '../src/components/table-custom.vue');
        const tableContent = fs.readFileSync(tableCustomPath, 'utf-8');
        const bug3Fixed = tableContent.includes('(currentPage.value - 1)');

        // Bug 4: 检查 permiss.ts
        const permissPath = path.join(__dirname, '../src/store/permiss.ts');
        const permissContent = fs.readFileSync(permissPath, 'utf-8');
        const bug4Fixed = permissContent.includes('|| defaultList.user') ||
            permissContent.includes('?? defaultList.user');

        // 所有 Bug 都应该被修复
        expect({
            bug1: bug1Fixed,
            bug2: bug2Fixed,
            bug3: bug3Fixed,
            bug4: bug4Fixed,
        }).toEqual({
            bug1: true,
            bug2: true,
            bug3: true,
            bug4: true,
        });
    });
});
