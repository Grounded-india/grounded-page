import { describe, expect, it } from "vitest";
import { claimsKeptLabel, sourceCountLabel, t } from "./ui-i18n";

describe("ui-i18n", () => {
  it("returns English chrome by default", () => {
    expect(t("en", "nav.front")).toBe("Front Page");
    expect(t(undefined, "deck.title")).toBe("In this edition");
  });

  it("returns Hindi chrome for hi", () => {
    expect(t("hi", "nav.front")).toBe("मुखपृष्ठ");
    expect(t("hi", "deck.title")).toBe("इस संस्करण में");
    expect(t("hi", "mode.debate")).toBe("बहस");
    expect(t("hi", "lang.label")).toBe("भाषा");
  });

  it("interpolates count placeholders", () => {
    expect(t("en", "deck.more", { n: 1 })).toBe("1 more dispatch");
    expect(t("en", "deck.more", { n: 3 })).toBe("3 more dispatches");
    expect(t("hi", "sources.many", { n: 4 })).toBe("4 स्रोत");
  });

  it("covers Kannada and Telugu chrome", () => {
    expect(t("kn", "nav.front")).toBe("ಮುಖಪುಟ");
    expect(t("kn", "footer.lettersNote")).toContain("ಅನಾಮ");
    expect(t("te", "nav.front")).toBe("ముఖపుట");
    expect(t("te", "briefs.title")).toContain("సంక్షిప్త");
  });

  it("formats source/claim count labels", () => {
    expect(sourceCountLabel("en", 1)).toBe("1 source");
    expect(sourceCountLabel("hi", 2)).toBe("2 स्रोत");
    expect(claimsKeptLabel("hi", 1)).toBe("1 दावा सुरक्षित");
  });
});
