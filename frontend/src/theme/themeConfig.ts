import type { ThemeConfig } from "antd";

/**
 * LMS Theme Configuration for Ant Design v6
 * Strictly based on: .agents/skills/ui-design-system/references/DESIGN.md
 */
export const lmsThemeConfig: ThemeConfig = {
  token: {
    // 1. Brand Palette
    colorPrimary: "#a3e635", // Lime Sprint (Primary Action)
    colorTextLightSolid: "#262626", // CRITICAL: Ink text on Lime background
    colorBgLayout: "#fcfff7", // Cream (Page canvas)
    colorBgContainer: "#ffffff", // Paper White (Cards, modals)
    colorText: "#262626", // Ink (Primary text)
    colorTextSecondary: "#525252", // Muted (Descriptions, meta)
    colorBorder: "#e5e5e5", // Rule (Dividers, borders)
    colorBorderSecondary: "#e5e5e5",

    // 2. Feedback / Learning Status
    colorSuccess: "#059669", // Completed, Passed quiz
    colorError: "#ef4444", // Failed, Expired, Input error
    colorWarning: "#f59e0b", // Due soon, Warning
    colorInfo: "#2563eb", // Instructor note, info

    // 3. Typography & Shapes
    fontFamily: `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    borderRadius: 4, // 4px for buttons, inputs
    controlHeight: 40, // 40px default height
    controlHeightLG: 46, // 46px large buttons
  },
  components: {
    Button: {
      borderRadius: 4,
      fontWeight: 500,
      primaryShadow: "2px 2px 0px 0px #262626", // Hard offset shadow for primary CTA
    },
    Input: {
      borderRadius: 4,
      colorBorder: "#e5e5e5",
    },
    Card: {
      borderRadiusLG: 8, // 8px for cards
      colorBorderSecondary: "#e5e5e5",
    },
    Tag: {
      borderRadiusSM: 9999, // Pill tags
    },
    Progress: {
      defaultColor: "#a3e635", // Lime progress stroke
    },
    Collapse: {
      borderRadiusLG: 8,
      colorBorder: "#e5e5e5",
    },
  },
};

export default lmsThemeConfig;
