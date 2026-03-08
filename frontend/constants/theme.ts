/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tabBarBackground: "#F5F5F5",
    tint: "#174735",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    settingsButton: "#EDEDED",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tabBarBackground: "#0E0F10",
    tint: "#174735",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    settingsButton: "#EDEDED",
  },
};

export const Fonts = {
  heading: "PlusJakartaSans_600SemiBold",
  body: "PlusJakartaSans_500Medium",
};
