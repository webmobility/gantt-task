import React from "react";
import { Gantt } from "../src";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
export default () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Gantt
        tasks={[
          {
            start: new Date(2020, 0, 1),
            end: new Date(2020, 2, 2),
            name: "Redesign website",
            id: "Task 0",
            progress: 45,
            type: "task",
          },
        ]}
      />
    </DndProvider>
  );
};
