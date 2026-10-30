import { describe, expect, it } from "vitest";
import { splitErrorText } from "./errorText";

describe("splitErrorText", () => {
  it("takes the first message line as headline and joins the rest with the stack trace", () => {
    const text = splitErrorText("java.lang.RuntimeException: boom\n\tat a.B.c(B.java:1)", ["at d.E.f(E.java:2)", ""]);
    expect(text.headline).toBe("java.lang.RuntimeException: boom");
    expect(text.lines).toEqual(["at a.B.c(B.java:1)", "at d.E.f(E.java:2)"]);
    expect(text.fullText).toBe("java.lang.RuntimeException: boom\nat a.B.c(B.java:1)\nat d.E.f(E.java:2)");
  });

  it("reads a socket stack trace given as one string", () => {
    expect(splitErrorText("boom", "at x\nat y").lines).toEqual(["at x", "at y"]);
    expect(splitErrorText("boom", null).lines).toEqual([]);
  });
});
