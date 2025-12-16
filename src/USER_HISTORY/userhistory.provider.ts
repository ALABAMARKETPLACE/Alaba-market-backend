import { UserHistory } from "./userhistory.entity";

export const UserHistoryProvider = [
  { provide: "UserHistoryRepository", useValue: UserHistory },
];
