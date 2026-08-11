import { describe, expect, it } from "vitest";
import {
  editionPath,
  isLang,
  normalizeLang,
  storyPath,
} from "./i18n";
import { storySlug } from "./slug";
import { resolveImageSrc } from "./parser";

describe("i18n helpers", () => {
  it("normalizes unknown langs to English", () => {
    expect(normalizeLang("hi")).toBe("hi");
    expect(normalizeLang("xx")).toBe("en");
    expect(isLang("kn")).toBe(true);
    expect(isLang("zz")).toBe(false);
  });

  it("builds English-stable and nested translated paths", () => {
    expect(editionPath("2026-08-03")).toBe("/edition/2026-08-03/");
    expect(editionPath("2026-08-03", "hi")).toBe("/edition/2026-08-03/hi/");
    expect(storyPath("2026-08-03", "1-wildfires")).toBe(
      "/story/2026-08-03/1-wildfires/",
    );
    expect(storyPath("2026-08-03", "1-स्पोकेन", "hi")).toBe(
      "/l/hi/story/2026-08-03/1-स्पोकेन/",
    );
  });
});

describe("Indic slug + image path parity", () => {
  it("keeps Devanagari matras/vowel signs in storySlug", () => {
    const headline =
      "ट्रंप का कहना है कि उन्होंने नई बातचीत के बीच ईरान पर तय हमले रोके";
    const slug = storySlug(5, headline);
    expect(slug).toBe(
      "5-ट्रंप-का-कहना-है-कि-उन्होंने-नई-बातचीत-के-बीच-ईरान-पर-तय-हमले-रोके",
    );
    // Matra on ट् (virama) / ा must survive — not stripped to consonants only.
    expect(slug).toContain("ट्रंप");
    expect(slug).toContain("उन्होंने");
  });

  it("resolveImageSrc normalizes nested ../../images paths", () => {
    expect(resolveImageSrc("../../images/2026-08-03/x.jpg")).toBe(
      "/images/2026-08-03/x.jpg",
    );
    expect(resolveImageSrc("../images/2026-08-03/x.jpg")).toBe(
      "/images/2026-08-03/x.jpg",
    );
    expect(resolveImageSrc("images/2026-08-03/x.jpg")).toBe(
      "/images/2026-08-03/x.jpg",
    );
    expect(resolveImageSrc("/images/2026-08-03/x.jpg")).toBe(
      "/images/2026-08-03/x.jpg",
    );
  });
});
