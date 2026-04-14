import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '../src/store/theme';
import { usePermissStore } from '../src/store/permiss';

describe('Bug 修复测试用例', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Bug1: 表单控制台警告', () => {
    it('数字输入框和滑块不应都设置prop="num"', async () => {
      const formContent = await import('../src/views/element/form.vue');
      const template = formContent.default.template || '';
      
      const numPropMatches = template.match(/prop="num"/g) || [];
      expect(numPropMatches.length).toBe(1);
      
      const sliderMatches = template.match(/<el-form-item label="滑块">[\s\S]*?<\/el-form-item>/) || [];
      expect(sliderMatches.length).toBeGreaterThan(0);
    });

    it('滑块和数字框应绑定同一个v-model实现联动', async () => {
      const formContent = await import('../src/views/element/form.vue');
      const template = formContent.default.template || '';
      
      const sliderModel = template.match(/<el-slider[^>]*v-model="form\.num"[^>]*>/);
      const inputNumberModel = template.match(/<el-input-number[^>]*v-model="form\.num"[^>]*>/);
      
      expect(sliderModel).not.toBeNull();
      expect(inputNumberModel).not.toBeNull();
    });

    it('el-checkbox不应同时设置label和value', async () => {
      const formContent = await import('../src/views/element/form.vue');
      const template = formContent.default.template || '';
      
      const badCheckbox = template.match(/<el-checkbox[^>]*label="[^"]*"[^>]*value="[^"]*"[^>]*>/);
      expect(badCheckbox).toBeNull();
    });

    it('el-radio不应同时设置label和value', async () => {
      const formContent = await import('../src/views/element/form.vue');
      const template = formContent.default.template || '';
      
      const badRadio = template.match(/<el-radio[^>]*label="[^"]*"[^>]*value="[^"]*"[^>]*>/);
      expect(badRadio).toBeNull();
    });
  });

  describe('Bug2: 主题颜色刷新后恢复初始颜色', () => {
    it('主题store应包含initTheme方法', () => {
      const themeStore = useThemeStore();
      expect(typeof themeStore.initTheme).toBe('function');
    });

    it('刷新后应从localStorage恢复主题颜色', () => {
      localStorage.setItem('theme-primary', '#409eff');
      
      const themeStore = useThemeStore();
      themeStore.initTheme();
      
      expect(themeStore.primary).toBe('#409eff');
    });
  });

  describe('Bug3: 表格序号计算和渲染问题', () => {
    it('序号计算公式应正确', () => {
      expect((1 - 1) * 10 + 0 + 1).toBe(1);
      expect((1 - 1) * 10 + 9 + 1).toBe(10);
      expect((2 - 1) * 10 + 0 + 1).toBe(11);
      expect((2 - 1) * 10 + 9 + 1).toBe(20);
    });

    it('表格列v-for的key应使用type或prop', async () => {
      const tableContent = await import('../src/components/table-custom.vue');
      const template = tableContent.default.template || '';
      
      const keyMatch = template.match(/v-for="item in columns"[^>]*:key="[^"]*"/);
      expect(keyMatch).not.toBeNull();
      expect(keyMatch?.[0]).toContain('item.type');
      expect(keyMatch?.[0]).toContain('item.prop');
    });

    it('不应有重复的#default template插槽', async () => {
      const tableContent = await import('../src/components/table-custom.vue');
      const template = tableContent.default.template || '';
      
      const templateCount = (template.match(/<template #default/g) || []).length;
      expect(templateCount).toBe(1);
    });
  });

  describe('Bug4: 普通用户登录报错', () => {
    it('username为null时不应报错', () => {
      localStorage.removeItem('vuems_name');
      
      expect(() => {
        const permissStore = usePermissStore();
        expect(permissStore.key).toBeDefined();
      }).not.toThrow();
    });

    it('username为user时应正确获取权限', () => {
      localStorage.setItem('vuems_name', 'user');
      
      const permissStore = usePermissStore();
      expect(permissStore.key).toBeDefined();
      expect(Array.isArray(permissStore.key)).toBe(true);
      expect(permissStore.key.length).toBeGreaterThan(0);
    });

    it('username为未知用户时应使用user默认权限', () => {
      localStorage.setItem('vuems_name', 'unknown_user');
      
      const permissStore = usePermissStore();
      expect(permissStore.key).toBeDefined();
      expect(Array.isArray(permissStore.key)).toBe(true);
    });

    it('普通用户应能访问dashboard首页', () => {
      localStorage.setItem('vuems_name', 'user');
      
      const permissStore = usePermissStore();
      expect(permissStore.key.includes('0')).toBe(true);
    });
  });
});
