import { ViewStyle } from "react-native";

export type ResponsiveBreakpoint = "mobile" | "tablet" | "desktop";

export type ResponsiveLayout = {
  breakpoint: ResponsiveBreakpoint;
  content: ViewStyle;
  header: ViewStyle;
  authHero: ViewStyle;
  authCard: ViewStyle;
  centered: ViewStyle;
  tabBar: ViewStyle;
};

export function getResponsiveLayout(width: number): ResponsiveLayout {
  const breakpoint =
    width >= 1024 ? "desktop" : width >= 768 ? "tablet" : "mobile";
  const horizontalPadding = breakpoint === "desktop" ? 40 : breakpoint === "tablet" ? 32 : 24;
  const maxWidth = breakpoint === "desktop" ? 900 : breakpoint === "tablet" ? 720 : undefined;
  const compactMaxWidth = breakpoint === "desktop" ? 560 : breakpoint === "tablet" ? 540 : undefined;
  const centered: ViewStyle = {
    width: "100%",
    maxWidth,
    alignSelf: "center",
  };

  return {
    breakpoint,
    content: {
      ...centered,
      paddingHorizontal: horizontalPadding,
    },
    header: {
      ...centered,
      paddingHorizontal: horizontalPadding,
    },
    authHero: {
      width: "100%",
      maxWidth: compactMaxWidth,
      alignSelf: "center",
    },
    authCard: {
      width: "100%",
      maxWidth: compactMaxWidth,
      alignSelf: "center",
      marginTop: breakpoint === "mobile" ? -24 : -38,
    },
    centered,
    tabBar: {
      height: breakpoint === "mobile" ? 84 : 76,
      paddingTop: breakpoint === "mobile" ? 10 : 8,
      paddingBottom: breakpoint === "mobile" ? 12 : 10,
    },
  };
}
