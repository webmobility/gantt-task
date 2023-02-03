import React from "react";
import { Gantt } from "../src";
export default () => {
  return (
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
  );
};
