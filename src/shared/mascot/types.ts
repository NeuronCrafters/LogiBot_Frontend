export type RobotMood = "welcome" | "thinking" | "curious" | "celebrate" | "encourage";
export type RobotVariant = "head" | "full";

export interface RobotSceneProps {
  variant: RobotVariant;
  mood: RobotMood;
  reaction: number;
  monochrome: boolean;
  onReady: () => void;
  onUnavailable: () => void;
}
