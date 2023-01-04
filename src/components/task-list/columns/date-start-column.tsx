import React from "react";

import format from "date-fns/format";

import { ColumnProps } from "../../../types/public-types";

export const DateStartColumn: React.FC<ColumnProps> = ({
  data: {
    dateSetup: {
      dateFormats,
      dateLocale,
    },

    task,
  },
}) => {
  if (task.type === "empty") {
    return null
  }

  try {
    return (
      <>
        {format(task.start, dateFormats.dateColumnFormat, {
          locale: dateLocale,
        })}
      </>
    );
  } catch (e) {
    return (
      <>
        {task.start.toString()}
      </>
    );
  }
};
