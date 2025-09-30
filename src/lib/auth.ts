/**
 * 统一认证管理器
 * 简化认证逻辑，统一管理用户状态和权限
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/types";
import { logger } from "@/lib/logger";
import { ErrorHandler, ErrorCode } from "@/lib/error-handler";

// 认证状态接口
export interface AuthState {
  // 状态
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 方法
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  
  // 权限检查
  hasRole: (role: string) => boolean;
  isAuthenticated: () => boolean;
  getAuthHeaders: () => { Authorization?: string };
}

// 路由权限配置
export const ROUTE_PERMISSIONS = {
  "/": "public",
  "/admin": "admin",
  "/agent": "agent",
  "/naoiod": "public",
} as const;

// 创建认证store
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoading: false,
      error: null,

      // 登录方法
      login: async (key: string) => {
        if (!key?.trim()) {
          set({ error: "请输入访问密钥" });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          logger.info("Attempting login", { keyPrefix: key.substring(0, 4) + "..." });

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: key.trim() }),
          });

          const data = await response.json();

          if (response.ok && data?.success && data?.data) {
            const user = data.data as User;
            set({ user, isLoading: false, error: null });
            
            logger.logUserAction("login_success", user.id, { 
              role: user.role,
              timestamp: new Date().toISOString()
            });
            
            return true;
          }

          const errorMessage = data?.error || "登录失败，请检查密钥是否正确";
          set({ error: errorMessage, isLoading: false });
          
          logger.warn("Login failed", { 
            keyPrefix: key.substring(0, 4) + "...",
            error: errorMessage 
          });
          
          return false;
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? `网络错误: ${error.message}` 
            : "登录时发生未知错误";
            
          set({ error: errorMessage, isLoading: false });
          
          ErrorHandler.handle(
            ErrorHandler.createError(ErrorCode.NETWORK_ERROR, errorMessage, { key: key.substring(0, 4) + "..." }),
            "Auth.login"
          );
          
          return false;
        }
      },

      // 登出方法
      logout: () => {
        const currentUser = get().user;
        
        if (currentUser) {
          logger.logUserAction("logout", currentUser.id, { role: currentUser.role });
        }
        
        set({ user: null, error: null });
        logger.info("User logged out");
      },

      // 更新用户信息
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          
          logger.info("User updated", { 
            userId: currentUser.id, 
            updates: Object.keys(updates) 
          });
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 权限检查
      hasRole: (role: string) => {
        const user = get().user;
        return user?.role === role;
      },

      // 认证状态检查
      isAuthenticated: () => {
        return !!get().user;
      },

      // 获取认证头
      getAuthHeaders: () => {
        const user = get().user;
        if (user?.id) {
          return { Authorization: `Bearer ${user.id}` };
        }
        return {};
      },
    }),
    {
      name: "agentverse-auth",
      storage: createJSONStorage(() => sessionStorage),
      // 只持久化用户信息，不持久化加载状态和错误
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// 路由守卫工具函数
export const checkRoutePermission = (pathname: string, userRole?: string): {
  allowed: boolean;
  redirectTo?: string;
} => {
  // 公共路由
  if (pathname.startsWith("/naoiod")) {
    return { allowed: true };
  }

  // 登录页面
  if (pathname === "/") {
    if (userRole) {
      return { allowed: false, redirectTo: `/${userRole}` };
    }
    return { allowed: true };
  }

  // 需要认证的路由
  if (!userRole) {
    return { allowed: false, redirectTo: "/" };
  }

  // 角色权限检查
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      return { allowed: false, redirectTo: "/agent" };
    }
  } else if (pathname.startsWith("/agent")) {
    if (userRole !== "agent") {
      return { allowed: false, redirectTo: "/admin" };
    }
  }

  return { allowed: true };
};

// 认证上下文Hook
export const useAuthContext = () => {
  const auth = useAuth();
  
  return {
    ...auth,
    // 添加便捷方法
    isAdmin: auth.hasRole("admin"),
    isAgent: auth.hasRole("agent"),
    userName: auth.user?.name || "用户",
    userAvatar: auth.user?.avatar,
  };
};

// 导出类型
export type { User };