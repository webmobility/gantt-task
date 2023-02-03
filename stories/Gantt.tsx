import React, { useState } from "react";
import { Column, Gantt, TaskOrEmpty, TitleColumn, ViewMode } from "../src";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { fr } from "date-fns/locale";
import { initTasks } from "./helper";

const columns: readonly Column[] = [
  {
    component: TitleColumn,
    width: 350,
    title: "Events",
  },
];

export default () => {
  const [tasks, setTasks] = useState<readonly TaskOrEmpty[]>(initTasks());
  return (
    <DndProvider backend={HTML5Backend}>
      <Gantt
        viewMode={ViewMode.Hour}
        canMoveTasks={false}
        canResizeColumns={true}
        columns={columns}
        dateLocale={fr}
        tasks={[
          {
            type: "project",
            id: "PRESS",
            name: "Activité Presse (1)",
            start: new Date("2023-02-03T13:36:10.893Z"),
            end: new Date("2023-02-03T13:36:10.893Z"),
            progress: 100,
            isDisabled: false,
            hideChildren: false,
          },
          {
            type: "task",
            id: "1",
            name: "Préparation réunion Cash investigation",
            start: new Date("2023-01-31T23:00:00.000Z"),
            end: new Date("2023-02-02T11:30:00.000Z"),
            parent: "PRESS",
            progress: 0,
            isDisabled: true,
          },
        ]}
      />
    </DndProvider>
  );
};
