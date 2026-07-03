export type EntitlementState = "accessible" | "locked" | "unknown";

export interface EntitlementDecision {
  state: EntitlementState;
  canReadInApp: boolean;
  requiresOfficialWeb: boolean;
  message: string;
}

export interface EntitlementRefreshResult {
  state: EntitlementState;
  returnedFromOfficialWeb: boolean;
  message: string;
}

export function decideEntitlement(state: EntitlementState): EntitlementDecision {
  if (state === "accessible") {
    return {
      state,
      canReadInApp: true,
      requiresOfficialWeb: false,
      message: "章节可在应用内阅读。"
    };
  }

  if (state === "locked") {
    return {
      state,
      canReadInApp: false,
      requiresOfficialWeb: true,
      message: "章节未解锁，购买或解锁必须跳转官方网页处理。"
    };
  }

  return {
    state,
    canReadInApp: false,
    requiresOfficialWeb: true,
    message: "章节权益状态未知，需要刷新或打开官方网页确认。"
  };
}


export function refreshEntitlementAfterOfficialWeb(
  previousState: EntitlementState,
  observedState: EntitlementState
): EntitlementRefreshResult {
  if (observedState === "accessible") {
    return {
      state: observedState,
      returnedFromOfficialWeb: true,
      message: "官方流程返回后状态已刷新为可访问。"
    };
  }

  if (observedState === "locked") {
    return {
      state: observedState,
      returnedFromOfficialWeb: true,
      message: "官方流程返回后章节仍未解锁，继续阻止应用内阅读。"
    };
  }

  return {
    state: previousState,
    returnedFromOfficialWeb: true,
    message: "官方流程返回后仍无法确认权益状态，继续阻止应用内阅读。"
  };
}
