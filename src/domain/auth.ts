export type AuthState = "authenticated" | "unauthenticated" | "expired";

export interface AuthDecision {
  state: AuthState;
  canUseAccountFeatures: boolean;
  requiresOfficialLogin: boolean;
  message: string;
}

export interface AuthRefreshResult {
  state: AuthState;
  returnedFromOfficialLogin: boolean;
  message: string;
}

export function decideAuth(state: AuthState): AuthDecision {
  if (state === "authenticated") {
    return {
      state,
      canUseAccountFeatures: true,
      requiresOfficialLogin: false,
      message: "账号状态可用。"
    };
  }

  if (state === "expired") {
    return {
      state,
      canUseAccountFeatures: false,
      requiresOfficialLogin: true,
      message: "登录状态已过期，需要重新登录。"
    };
  }

  return {
    state,
    canUseAccountFeatures: false,
    requiresOfficialLogin: true,
    message: "尚未登录，书架、历史和真实章节需要登录后使用。"
  };
}

export function refreshAuthAfterOfficialLogin(
  previousState: AuthState,
  observedState: AuthState
): AuthRefreshResult {
  if (observedState === "authenticated") {
    return {
      state: observedState,
      returnedFromOfficialLogin: true,
      message: "官方登录返回后账号状态已刷新。"
    };
  }

  if (observedState === "expired") {
    return {
      state: observedState,
      returnedFromOfficialLogin: true,
      message: "官方登录返回后状态仍过期，继续阻止账号功能。"
    };
  }

  return {
    state: previousState === "authenticated" ? "expired" : previousState,
    returnedFromOfficialLogin: true,
    message: "官方登录返回后仍未确认登录成功，继续阻止账号功能。"
  };
}
