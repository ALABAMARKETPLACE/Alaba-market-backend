import { TestTable } from "./testtable.entity";

export const TestTableProvider = [
  { provide: "TestTableRepository", useValue: TestTable },
];
