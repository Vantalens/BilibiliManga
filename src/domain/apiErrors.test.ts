import { describe, expect, it } from "vitest";
import { describeApiFailure } from "./apiErrors";

describe("api failure descriptions", () => {
  it("explains official manga code 99 as a request-context validation failure", () => {
    expect(describeApiFailure("api returned code 99: 请求失败,请稍后重试。")).toEqual({
      title: "官方接口拒绝了这次请求",
      detail: "请求上下文没有通过哔哩哔哩漫画校验。请确认已扫码登录；如果官网可读但这里失败，需要反馈该漫画和章节。",
      kind: "official_context",
    });
  });

  it("explains unauthenticated responses without exposing cookie details", () => {
    expect(describeApiFailure("api returned code unauthenticated: need login")).toMatchObject({
      title: "需要重新登录",
      kind: "login_required",
    });
  });

  it("classifies missing stored cookies as a login problem", () => {
    expect(describeApiFailure("No stored cookies found")).toMatchObject({
      title: "需要重新登录",
      kind: "login_required",
    });
  });

  it("keeps unknown failures concise", () => {
    expect(describeApiFailure("transport failed: dns error")).toMatchObject({
      title: "网络请求失败",
      kind: "network",
    });
  });
});
