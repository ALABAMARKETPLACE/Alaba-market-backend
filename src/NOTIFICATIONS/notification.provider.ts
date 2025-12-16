import { NotificationsModal } from "./notification.entity";

export const NotificationsProvider = {
  provide: "NotificationsRepository",
  useValue: NotificationsModal,
};
