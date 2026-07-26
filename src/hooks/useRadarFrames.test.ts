import { describe, expect, it } from "vitest";
import { buildFrames, type RainViewerResponse } from "./useRadarFrames";

function pastFrame(time: number) {
  return { path: `/v2/radar/${time}`, time };
}

describe("buildFrames", () => {
  it("takes only the last 7 past frames plus all nowcast frames", () => {
    const past = Array.from({ length: 10 }, (_, i) => pastFrame(1000 + i));
    const nowcast = [pastFrame(2000), pastFrame(2010), pastFrame(2020)];
    const data: RainViewerResponse = { host: "https://tilecache.rainviewer.com", radar: { past, nowcast } };

    const frames = buildFrames(data);

    expect(frames).toHaveLength(10); // 7 past + 3 nowcast
    expect(frames.slice(0, 7).every((f) => !f.isForecast)).toBe(true);
    expect(frames.slice(7).every((f) => f.isForecast)).toBe(true);
    // Kept the most recent 7 (1003..1009), not the oldest.
    expect(frames[0].time).toBe(1003);
    expect(frames[6].time).toBe(1009);
  });

  it("marks every frame as observed when nowcast is empty", () => {
    const past = [pastFrame(1000), pastFrame(1001)];
    const data: RainViewerResponse = { host: "https://tilecache.rainviewer.com", radar: { past, nowcast: [] } };

    const frames = buildFrames(data);

    expect(frames).toHaveLength(2);
    expect(frames.every((f) => !f.isForecast)).toBe(true);
  });

  it("keeps all past frames when fewer than 7 are available", () => {
    const past = [pastFrame(1000), pastFrame(1001), pastFrame(1002)];
    const data: RainViewerResponse = { radar: { past, nowcast: [] } };

    expect(buildFrames(data)).toHaveLength(3);
  });

  it("builds a Leaflet-ready tile URL template with literal {z}/{x}/{y} tokens", () => {
    const data: RainViewerResponse = {
      host: "https://tilecache.rainviewer.com",
      radar: { past: [{ path: "/v2/radar/1700000000", time: 1700000000 }], nowcast: [] },
    };

    const [frame] = buildFrames(data);
    expect(frame.url).toBe(
      "https://tilecache.rainviewer.com/v2/radar/1700000000/256/{z}/{x}/{y}/2/1_1.png",
    );
  });

  it("falls back to the default tilecache host when none is provided", () => {
    const data: RainViewerResponse = { radar: { past: [{ path: "/v2/radar/1", time: 1 }], nowcast: [] } };
    expect(buildFrames(data)[0].url).toContain("https://tilecache.rainviewer.com");
  });

  it("drops frames missing a path or time", () => {
    const data: RainViewerResponse = {
      radar: {
        past: [{ path: "/v2/radar/1", time: 1 }, { path: undefined, time: 2 }, { path: "/v2/radar/3" }],
        nowcast: [],
      },
    };
    expect(buildFrames(data)).toHaveLength(1);
  });

  it("returns an empty array when radar data is entirely missing", () => {
    expect(buildFrames({})).toEqual([]);
  });
});
