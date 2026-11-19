export type NotificationType = "quiz_published" | "quiz_completion_progress" | "exam_published" | "exam_submission_progress" | "exam_results_released";

export interface AppNotification {
  id: string;
  type: NotificationType;
  params: Record<string, string | number>;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
}
