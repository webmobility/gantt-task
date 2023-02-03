import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useLatest from "use-latest";

import enDateLocale from 'date-fns/locale/en-US';

import {
  ChangeAction,
  CheckTaskIdExistsAtLevel,
  ColorStyles,
  Column,
  ContextMenuOptionType,
  DateFormats,
  DateSetup,
  Dependency,
  Distances,
  FixPosition,
  GanttProps,
  OnDateChange,
  OnDateChangeSuggestionType,
  OnRelationChange,
  Task,
  TaskOrEmpty,
  ViewMode,
} from "../../types/public-types";
import { GridProps } from "../grid/grid";
import { ganttDateRange } from "../../helpers/date-helper";
import { CalendarProps } from "../calendar/calendar";
import { TaskGanttContentProps } from "./task-gantt-content";
import { TaskListHeaderDefault } from "../task-list/task-list-header";
import { TaskListTableDefault } from "../task-list/task-list-table";
import { StandardTooltipContent, Tooltip } from "../other/tooltip";
import { VerticalScroll } from "../other/vertical-scroll";
import { TaskListProps, TaskList } from "../task-list/task-list";
import { TaskGantt } from "./task-gantt";
import { sortTasks } from "../../helpers/sort-tasks";
import { getChildsAndRoots } from "../../helpers/get-childs-and-roots";
import { getTaskCoordinates as getTaskCoordinatesDefault } from "../../helpers/get-task-coordinates";
import { getTasksMap } from "../../helpers/get-tasks-map";
import { getMapTaskToGlobalIndex } from "../../helpers/get-map-task-to-global-index";
import { getMapTaskToRowIndex } from "../../helpers/get-map-task-to-row-index";
import { getChildOutOfParentWarnings } from "../../helpers/get-child-out-of-parent-warnings";
import { getDependencyMapAndWarnings } from "../../helpers/get-dependency-map-and-warnings";
import {
  countTaskCoordinates as defaultCountTaskCoordinates,
  getMapTaskToCoordinates,
} from "../../helpers/get-map-task-to-coordinates";
import { getCriticalPath } from "../../helpers/get-critical-path";
import { getMapTaskToNestedIndex } from "../../helpers/get-map-task-to-nested-index";
import { getInitialClosedTasks } from "../../helpers/get-initial-closed-tasks";
import { collectVisibleTasks } from "../../helpers/collect-visible-tasks";
import { getTaskToHasDependencyWarningMap } from "../../helpers/get-task-to-has-dependency-warning-map";
 
import { TitleColumn } from "../task-list/columns/title-column";
import { DateStartColumn } from "../task-list/columns/date-start-column";
import { DateEndColumn } from "../task-list/columns/date-end-column";
import { useColumnResize } from "./use-column-resize";
import { getChangeTaskMetadata } from "../../helpers/get-change-task-metadata";
import { DeleteColumn } from "../task-list/columns/delete-column";
import { EditColumn } from "../task-list/columns/edit-column";
import { AddColumn } from "../task-list/columns/add-column";
import { useCreateRelation } from "./use-create-relation";
import { useTaskDrag } from "./use-task-drag";
import { useTaskTooltip } from "../../helpers/use-task-tooltip";

import { useOptimizedList } from "../../helpers/use-optimized-list";
import { useVerticalScrollbars } from "./use-vertical-scrollbars";
import { useHorizontalScrollbars } from "./use-horizontal-scrollbars";

import { getDateByOffset } from "../../helpers/get-date-by-offset";
import { getDatesDiff } from "../../helpers/get-dates-diff";
import { DependenciesColumn } from "../task-list/columns/dependencies-column";
import { BarMoveAction } from "../../types/gantt-task-actions";
import { getMinAndMaxChildsMap } from "../../helpers/get-min-and-max-childs-map";
import { useGetTaskCurrentState } from "./use-get-task-current-state";
import { useSelection } from "./use-selection";
import { defaultCheckIsHoliday } from "./default-check-is-holiday";
import { useTableResize } from "./use-table-resize";
import { defaultRoundEndDate } from "./default-round-end-date";
import { defaultRoundStartDate } from "./default-round-start-date";

import { useContextMenu } from "./use-context-menu";
import { ContextMenu } from "../context-menu";
import { useHandleAction } from "./use-handle-action";
import { defaultGetCopiedTaskId } from "./default-get-copied-task-id";

import { copyTasks } from "../../helpers/copy-tasks";
import { copyOption } from "../../context-menu-options/copy";
import { cutOption } from "../../context-menu-options/cut";
import { pasteOption } from "../../context-menu-options/paste";
import { deleteOption } from "../../context-menu-options/delete";

import { useHolidays } from "./use-holidays";

import styles from "./gantt.module.css";

const defaultColors: ColorStyles = {
  arrowColor: "grey",
  arrowCriticalColor: "#ff0000",
  arrowWarningColor: "#ffbc00",
  barProgressColor: "#a3a3ff",
  barProgressCriticalColor: "#ff1919",
  barProgressSelectedColor: "#8282f5",
  barProgressSelectedCriticalColor: "#ff0000",
  barBackgroundColor: "#b8c2cc",
  barBackgroundCriticalColor: "#ff6363",
  barBackgroundSelectedColor: "#aeb8c2",
  barBackgroundSelectedCriticalColor: "#ff8e8e",
  groupProgressColor: "#2dbb2e",
  groupProgressCriticalColor: "#2dbb2e",
  groupProgressSelectedColor: "#28a329",
  groupProgressSelectedCriticalColor: "#28a329",
  groupBackgroundColor: "#006bc1",
  groupBackgroundCriticalColor: "#006bc1",
  groupBackgroundSelectedColor: "#407fbf",
  groupBackgroundSelectedCriticalColor: "#407fbf",
  projectProgressColor: "#7db59a",
  projectProgressCriticalColor: "#7db59a",
  projectProgressSelectedColor: "#59a985",
  projectProgressSelectedCriticalColor: "#59a985",
  projectBackgroundColor: "#fac465",
  projectBackgroundCriticalColor: "#fac465",
  projectBackgroundSelectedColor: "#f7bb53",
  projectBackgroundSelectedCriticalColor: "#f7bb53",
  milestoneBackgroundColor: "#f1c453",
  milestoneBackgroundCriticalColor: "#ff8e8e",
  milestoneBackgroundSelectedColor: "#f29e4c",
  milestoneBackgroundSelectedCriticalColor: "#ff0000",
  evenTaskBackgroundColor: "#f5f5f5",
  holidayBackgroundColor: "rgba(233, 233, 233, 0.3)",
  selectedTaskBackgroundColor: "rgba(252, 248, 227, 0.5)",
  todayColor: "rgba(252, 248, 227, 0.5)",
  contextMenuBoxShadow: "rgb(0 0 0 / 25%) 1px 1px 5px 1px",
  contextMenuBgColor: "#fff",
  contextMenuTextColor: "inherit",
};

const defaultDateFormats: DateFormats = {
  dateColumnFormat: "E, d MMMM yyyy",
  dayBottomHeaderFormat: "E, d",
  dayTopHeaderFormat: "E, d",
  hourBottomHeaderFormat: "HH",
  monthBottomHeaderFormat: "LLL",
  monthTopHeaderFormat: "LLLL",
};

const defaultDistances: Distances = {
  actionColumnWidth: 40,
  arrowIndent: 20,
  barCornerRadius: 3,
  barFill: 60,
  columnWidth: 60,
  contextMenuIconWidth: 20,
  contextMenuOptionHeight: 25,
  contextMenuSidePadding: 10,
  dateCellWidth: 220,
  dependenciesCellWidth: 120,
  dependencyFixHeight: 20,
  dependencyFixIndent: 50,
  dependencyFixWidth: 20,
  expandIconWidth: 20,
  handleWidth: 8,
  headerHeight: 50,
  ganttHeight: 600,
  nestedTaskNameOffset: 20,
  relationCircleOffset: 10,
  relationCircleRadius: 5,
  rowHeight: 50,
  taskWarningOffset: 35,
  titleCellWidth: 220,
};

export const Gantt: React.FC<GanttProps> = ({
  TaskListHeader = TaskListHeaderDefault,
  TaskListTable = TaskListTableDefault,
  TooltipContent = StandardTooltipContent,
  canMoveTasks = true,
  canResizeColumns = true,
  checkIsHoliday: checkIsHolidayProp = defaultCheckIsHoliday,
  colors = undefined,
  columns: columnsProp = undefined,
  comparisonLevels = 1,
  contextMenuOptions: contextMenuOptionsProp = undefined,
  dateFormats: dateFormatsProp = undefined,
  dateLocale = enDateLocale,
  distances: distancesProp = undefined,
  fixEndPosition: fixEndPositionProp = undefined,
  fixStartPosition: fixStartPositionProp = undefined,
  fontFamily = "Arial, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue",
  fontSize = "14px",
  getCopiedTaskId = defaultGetCopiedTaskId,
  icons = undefined,
  isDeleteDependencyOnDoubleClick = true,
  isMoveChildsWithParent = true,
  isRecountParentsOnChange = true,
  isShowChildOutOfParentWarnings = false,
  isShowCriticalPath = false,
  isShowDependencyWarnings = false,
  isShowTaskNumbers = true,
  isUnknownDates = false,
  isAdjustToWorkingDates = true,
  onAddTask = undefined,
  onAddTaskClick = undefined,
  onArrowDoubleClick: onArrowDoubleClickProp = undefined,
  onChangeTasks = undefined,
  onClick = undefined,
  onDateChange: onDateChangeProp = undefined,
  onDelete = undefined,
  onDoubleClick = undefined,
  onEditTask = undefined,
  onEditTaskClick = undefined,
  onFixDependencyPosition: onFixDependencyPositionProp = undefined,
  onMoveTaskAfter = undefined,
  onMoveTaskInside = undefined,
  onProgressChange: onProgressChangeProp = undefined,
  onRelationChange: onRelationChangeProp = undefined,
  onResizeColumn = undefined,
  preStepsCount = 1,
  renderBottomHeader = undefined,
  renderTopHeader = undefined,
  roundEndDate: roundEndDateProp = defaultRoundEndDate,
  roundStartDate: roundStartDateProp = defaultRoundStartDate,
  rtl = false,
  tasks,
  timeStep = 300000,
  viewDate,
  viewMode = ViewMode.Day,
}) => {
  const ganttSVGRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  const {
    contextMenu,
    handleCloseContextMenu,
    handleOpenContextMenu,
  } = useContextMenu(wrapperRef);

  const [
    horizontalContainerRef,
    taskListContainerRef,
    verticalScrollbarRef,
    scrollY,
    setScrollYProgrammatically,
    onVerticalScrollbarScrollY,
    scrollToTopStep,
    scrollToBottomStep,
  ] = useVerticalScrollbars();

  const [
    verticalGanttContainerRef,
    scrollX,
    setScrollXProgrammatically,
    onVerticalScrollbarScrollX,
    scrollToLeftStep,
    scrollToRightStep,
  ] = useHorizontalScrollbars();

  const scrollXRef = useLatest(scrollX);

  const roundEndDate = useCallback(
    (date: Date) => roundEndDateProp(date, viewMode),
    [roundEndDateProp, viewMode],
  );

  const roundStartDate = useCallback(
    (date: Date) => roundStartDateProp(date, viewMode),
    [roundStartDateProp, viewMode],
  );

  const [closedTasks, setClosedTasks] = useState(() => getInitialClosedTasks(tasks));

  const tasksRef = useLatest(tasks);

  const [currentViewDate, setCurrentViewDate] = useState<Date | undefined>(
    undefined
  );

  const sortedTasks = useMemo<readonly TaskOrEmpty[]>(
    () => [...tasks].sort(sortTasks),
    [tasks],
  );

  const [childTasksMap, rootTasksMap] = useMemo(
    () => getChildsAndRoots(sortedTasks, null),
    [sortedTasks],
  );

  const minAndMaxChildsMap = useMemo(
    () => getMinAndMaxChildsMap(rootTasksMap, childTasksMap),
    [rootTasksMap, childTasksMap],
  );

  const childTasksMapRef = useLatest(childTasksMap);

  const [visibleTasks, visibleTasksMirror] = useMemo(
    () => collectVisibleTasks(
      childTasksMap,
      rootTasksMap,
      closedTasks,
    ),
    [
      childTasksMap,
      rootTasksMap,
      closedTasks,
    ],
  );

  const tasksMap = useMemo(
    () => getTasksMap(tasks),
    [tasks],
  );

  const tasksMapRef = useLatest(tasksMap);

  const checkTaskIdExists = useCallback<CheckTaskIdExistsAtLevel>((
    newId,
    comparisonLevel = 1,
  ) => {
    const tasksAtLevelMap = tasksMapRef.current.get(comparisonLevel);

    if (!tasksAtLevelMap) {
      return false;
    }

    return tasksAtLevelMap.has(newId);
  }, [tasksMapRef]);

  const makeCopies = useCallback((tasksForCopy: readonly TaskOrEmpty[]) => copyTasks(
    tasksForCopy,
    getCopiedTaskId,
    checkTaskIdExists,
  ), [checkTaskIdExists, getCopiedTaskId]);

  const mapTaskToGlobalIndex = useMemo(
    () => getMapTaskToGlobalIndex(tasks),
    [tasks],
  );

  const mapTaskToGlobalIndexRef = useLatest(mapTaskToGlobalIndex);

  const getTaskGlobalIndexByRef = useCallback((task: Task) => {
    const {
      id,
      comparisonLevel = 1,
    } = task;

    const indexesByLevel = mapTaskToGlobalIndexRef.current.get(comparisonLevel);

    if (!indexesByLevel) {
      return -1;
    }

    const res = indexesByLevel.get(id);

    if (typeof res === 'number') {
      return res;
    }

    return -1;
  }, [mapTaskToGlobalIndexRef]);

  const mapTaskToNestedIndex = useMemo(
    () => getMapTaskToNestedIndex(
      childTasksMap,
      rootTasksMap,
    ),
    [
      childTasksMap,
      rootTasksMap,
    ],
  );

  const childOutOfParentWarnings = useMemo(
    () => {
      if (!isShowChildOutOfParentWarnings) {
        return null;
      }

      return getChildOutOfParentWarnings(
        tasks,
        childTasksMap,
      );
    },
    [tasks, childTasksMap, isShowChildOutOfParentWarnings],
  );

  const distances = useMemo<Distances>(() => ({
    ...defaultDistances,
    ...distancesProp,
  }), [distancesProp]);

  const fullRowHeight = useMemo(
    () => distances.rowHeight * comparisonLevels,
    [distances, comparisonLevels],
  );

  const renderedRowIndexes = useOptimizedList(
    horizontalContainerRef,
    'scrollTop',
    distances.rowHeight,
  );

  const colorStyles = useMemo<ColorStyles>(() => ({
    ...defaultColors,
    ...colors,
  }), [
    colors,
  ]);

  const taskHeight = useMemo(
    () => (distances.rowHeight * distances.barFill) / 100,
    [distances],
  );

  const taskYOffset = useMemo(
    () => (distances.rowHeight - taskHeight) / 2,
    [distances, taskHeight],
  );

  const taskHalfHeight = useMemo(
    () => Math.round(taskHeight / 2),
    [taskHeight],
  );

  const maxLevelLength = useMemo(() => {
    let maxLength = 0;
    const countByLevel: Record<string, number> = {};

    visibleTasks.forEach(({
      comparisonLevel = 1,
    }) => {
      if (!countByLevel[comparisonLevel]) {
        countByLevel[comparisonLevel] = 0;
      }
  
      ++countByLevel[comparisonLevel];

      if (comparisonLevel <= comparisonLevels && maxLength < countByLevel[comparisonLevel]) {
        maxLength = countByLevel[comparisonLevel];
      }
    });

    return maxLength;
  }, [visibleTasks, comparisonLevels]);

  const ganttFullHeight = useMemo(
    () => maxLevelLength * fullRowHeight,
    [maxLevelLength, fullRowHeight],
  );

  const ganttHeight = useMemo(
    () => distances.ganttHeight ? Math.min(distances.ganttHeight, ganttFullHeight) : ganttFullHeight,
    [distances, ganttFullHeight],
  );

  const [taskToRowIndexMap, rowIndexToTaskMap, mapGlobalRowIndexToTask] = useMemo(
    () => getMapTaskToRowIndex(
      visibleTasks,
      comparisonLevels,
    ),
    [visibleTasks, comparisonLevels],
  );

  const {
    checkHasCopyTasks,
    checkHasCutTasks,
    copyIdsMirror,
    copySelectedTasks,
    copyTask,
    cutIdsMirror,
    cutSelectedTasks,
    cutTask,
    resetSelectedTasks,
    selectTaskOnMouseDown,
    selectedIdsMirror,
  } = useSelection(
    taskToRowIndexMap,
    rowIndexToTaskMap,
    checkTaskIdExists,
  );

  const [startDate, minTaskDate, datesLength] = useMemo(() =>  ganttDateRange(
    visibleTasks,
    viewMode,
    preStepsCount,
  ), [visibleTasks, viewMode, preStepsCount]);

  const getDate = useCallback(
    (index: number) => getDateByOffset(startDate, index, viewMode),
    [startDate, viewMode],
  );

  const dateFormats = useMemo<DateFormats>(() => ({
    ...defaultDateFormats,
    ...dateFormatsProp,
  }), [
    dateFormatsProp,
  ]);

  const dateSetup = useMemo<DateSetup>(() => ({
    dateFormats,
    dateLocale,
    isUnknownDates,
    preStepsCount,
    viewMode,
  }), [
    dateFormats,
    dateLocale,
    isUnknownDates,
    preStepsCount,
    viewMode,
  ]);

  const {
    checkIsHoliday,
    adjustTaskToWorkingDates,
  } = useHolidays({
    checkIsHolidayProp,
    dateSetup,
    isAdjustToWorkingDates,
    minTaskDate,
  });

  const svgWidth = useMemo(
    () => datesLength * distances.columnWidth,
    [datesLength, distances],
  );

  const renderedColumnIndexes = useOptimizedList(
    verticalGanttContainerRef,
    'scrollLeft',
    distances.columnWidth,
  );

  const svgClientWidthRef = useLatest(renderedColumnIndexes && renderedColumnIndexes[4]);

  const countTaskCoordinates = useCallback(
    (task: Task) => defaultCountTaskCoordinates(
      task,
      taskToRowIndexMap,
      startDate,
      viewMode,
      rtl,
      fullRowHeight,
      taskHeight,
      taskYOffset,
      distances,
      svgWidth,
    ),
    [
      taskToRowIndexMap,
      startDate,
      viewMode,
      rtl,
      fullRowHeight,
      taskHeight,
      taskYOffset,
      distances,
      svgWidth,
    ],
  );

  const mapTaskToCoordinates = useMemo(() => getMapTaskToCoordinates(
    tasks,
    visibleTasksMirror,
    taskToRowIndexMap,
    startDate,
    viewMode,
    rtl,
    fullRowHeight,
    taskHeight,
    taskYOffset,
    distances,
    svgWidth,
  ), [
    distances,
    fullRowHeight,
    taskToRowIndexMap,
    rtl,
    startDate,
    svgWidth,
    taskHeight,
    tasks,
    taskYOffset,
    viewMode,
    visibleTasksMirror,
  ]);

  const mapTaskToCoordinatesRef = useLatest(mapTaskToCoordinates);

  const scrollToTask = useCallback((task: Task) => {
    const {
      x1,
    } = getTaskCoordinatesDefault(task, mapTaskToCoordinatesRef.current);

    setScrollXProgrammatically(x1 - 100);
  }, [
    mapTaskToCoordinatesRef,
    setScrollXProgrammatically,
  ]);

  const [dependencyMap, dependentMap, dependencyMarginsMap] = useMemo(
    () => getDependencyMapAndWarnings(
      tasks,
      visibleTasksMirror,
      tasksMap,
      mapTaskToCoordinates,
      fullRowHeight,
      isShowDependencyWarnings,
      isShowCriticalPath,
    ),
    [
      tasks,
      visibleTasksMirror,
      tasksMap,
      mapTaskToCoordinates,
      fullRowHeight,
      isShowDependencyWarnings,
      isShowCriticalPath,
    ],
  );

  const dependentMapRef = useLatest(dependentMap);

  const criticalPaths = useMemo(() => {
    if (isShowCriticalPath) {
      return getCriticalPath(
        rootTasksMap,
        childTasksMap,
        tasksMap,
        dependencyMarginsMap,
        dependencyMap,
      );
    }

    return null;
  }, [
    isShowCriticalPath,
    rootTasksMap,
    childTasksMap,
    tasksMap,
    dependencyMarginsMap,
    dependencyMap,
  ]);

  const taskToHasDependencyWarningMap = useMemo(
    () => {
      if (!isShowDependencyWarnings) {
        return null;
      }

      return getTaskToHasDependencyWarningMap(dependencyMarginsMap);
    },
    [dependencyMarginsMap, isShowDependencyWarnings],
  );

  useEffect(() => {
    if (rtl) {
      setScrollXProgrammatically(datesLength * distances.columnWidth);
    }
  }, [
    datesLength,
    distances,
    rtl,
    setScrollXProgrammatically,
    scrollX,
  ]);

  useEffect(() => {
    if (
      ((viewDate && !currentViewDate) ||
        (viewDate && currentViewDate?.valueOf() !== viewDate.valueOf()))
    ) {
      const index = getDatesDiff(viewDate, startDate, viewMode);

      if (index < 0) {
        return;
      }
      setCurrentViewDate(viewDate);
      setScrollXProgrammatically(distances.columnWidth * index);
    }
  }, [
    currentViewDate,
    distances,
    setCurrentViewDate,
    setScrollXProgrammatically,
    startDate,
    viewDate,
    viewMode,
  ]);

  // scroll events
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (ganttHeight) {
        const prevScrollY = horizontalContainerRef.current?.scrollTop || 0;

        let newScrollY = prevScrollY + event.deltaY;
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        if (newScrollY !== prevScrollY) {
          setScrollYProgrammatically(newScrollY);
          event.preventDefault();
        }
      }
    };

    const wrapperNode = wrapperRef.current;

    // subscribe if scrol necessary
    if (wrapperNode) {
      wrapperNode.addEventListener("wheel", handleWheel, {
        passive: false,
      });
    }

    return () => {
      if (wrapperNode) {
        wrapperNode.removeEventListener("wheel", handleWheel);
      }
    };
  }, [
    distances,
    ganttHeight,
    ganttFullHeight,
    setScrollXProgrammatically,
    setScrollYProgrammatically,
    svgWidth,
    rtl,
    wrapperRef,
  ]);

  /**
   * Handles arrow keys events and transform it to new scroll
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const {
      columnWidth,
      rowHeight,
    } = distances;

    event.preventDefault();
    let newScrollY = scrollY;
    let newScrollX = scrollX;
    let isX = true;
    switch (event.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        newScrollY += rowHeight;
        isX = false;
        break;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        newScrollY -= rowHeight;
        isX = false;
        break;
      case "Left":
      case "ArrowLeft":
        newScrollX -= columnWidth;
        break;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        newScrollX += columnWidth;
        break;
    }
    if (isX) {
      if (newScrollX < 0) {
        newScrollX = 0;
      } else if (newScrollX > svgWidth) {
        newScrollX = svgWidth;
      }
      setScrollXProgrammatically(newScrollX);
    } else {
      if (newScrollY < 0) {
        newScrollY = 0;
      } else if (newScrollY > ganttFullHeight - ganttHeight) {
        newScrollY = ganttFullHeight - ganttHeight;
      }
      setScrollYProgrammatically(newScrollY);
    }
  };

  const handleExpanderClick = useCallback((task: Task) => {
    setClosedTasks((prevClosedTasks) => {
      const nextClosedTasks = {
        ...prevClosedTasks,
      };

      const prevValue = prevClosedTasks[task.id];

      if (prevValue) {
        delete nextClosedTasks[task.id];
      } else {
        nextClosedTasks[task.id] = true;
      }

      return nextClosedTasks;
    });
  }, []);

  const [columnsState, setColumns] = useState<readonly Column[]>(() => {
    if (columnsProp) {
      return columnsProp;
    }

    const {
      titleCellWidth,
      dateCellWidth,
      dependenciesCellWidth,
      actionColumnWidth,
    } = distances;

    return [
      {
        component: TitleColumn,
        width: titleCellWidth,
        title: "Name",
      },

      {
        component: DateStartColumn,
        width: dateCellWidth,
        title: "From",
      },

      {
        component: DateEndColumn,
        width: dateCellWidth,
        title: "To",
      },

      {
        component: DependenciesColumn,
        width: dependenciesCellWidth,
        title: "Dependencies",
      },

      {
        component: DeleteColumn,
        width: actionColumnWidth,
        canResize: false,
      },

      {
        component: EditColumn,
        width: actionColumnWidth,
        canResize: false,
      },

      {
        component: AddColumn,
        width: actionColumnWidth,
        canResize: false,
      },
    ];
  });

  const columns = (columnsProp && onResizeColumn) ? columnsProp : columnsState;

  const taskListWidth = useMemo(
    () => columns.reduce((res, { width }) => res + width, 0),
    [columns],
  );

  const onResizeColumnWithDelta = useCallback((columnIndex: number, delta: number) => {
    const {
      width,
    } = columns[columnIndex];

    const nextWidth = Math.max(10, width + delta);

    const nextColumns = [...columns];
    nextColumns[columnIndex] = {
      ...columns[columnIndex],
      width: nextWidth,
    };

    setColumns(nextColumns);

    if (onResizeColumn) {
      onResizeColumn(nextColumns, columnIndex, Math.max(10, width + delta));
    }
  }, [columns, onResizeColumn]);

  const [columnResizeEvent, onColumnResizeStart] = useColumnResize(onResizeColumnWithDelta);

  const [tableWidthState, setTableWidth] = useState(() => distances.tableWidth || taskListWidth);

  const onResizeTableWithDelta = useCallback((delta: number) => {
    setTableWidth((prevValue) => Math.min(
      Math.max(
        prevValue + delta,
        50,
      ),
      taskListWidth,
    ));
  }, [taskListWidth]);

  const [tableResizeEvent, onTableResizeStart] = useTableResize(onResizeTableWithDelta);

  const tableWidth = useMemo(() => {
    if (tableResizeEvent) {
      return Math.min(
        Math.max(
          tableWidthState + tableResizeEvent.endX - tableResizeEvent.startX,
          50,
        ),
        taskListWidth,
      );
    }

    return tableWidthState;
  }, [
    tableResizeEvent,
    tableWidthState,
    taskListWidth,
  ]);

  const getMetadata = useCallback(
    (changeAction: ChangeAction) => getChangeTaskMetadata({
      adjustTaskToWorkingDates,
      changeAction,
      childTasksMap: childTasksMapRef.current,
      dependentMap: dependentMapRef.current,
      mapTaskToGlobalIndex: mapTaskToGlobalIndexRef.current,
      isRecountParentsOnChange,
      isMoveChildsWithParent,
      tasksMap: tasksMapRef.current,
    }),
    [
      adjustTaskToWorkingDates,
      childTasksMapRef,
      dependentMapRef,
      isMoveChildsWithParent,
      isRecountParentsOnChange,
      mapTaskToGlobalIndexRef,
      tasksMapRef,
    ],
  );

  /**
   * Result is not readonly for optimization
   */
  const prepareSuggestions = useCallback((
    suggestions: readonly OnDateChangeSuggestionType[],
  ): TaskOrEmpty[] => {
    const prevTasks = [...tasksRef.current];

    const nextTasks = prevTasks;

    suggestions.forEach(([start, end, task, index]) => {
      nextTasks[index] = {
        ...task,
        start,
        end,
      };
    });

    return nextTasks;
  }, [
    tasksRef,
  ]);

  const handleEditTask = useCallback((task: TaskOrEmpty) => {
    if (!onEditTaskClick && (!onEditTask || !onChangeTasks)) {
      return;
    }

    const {
      id,
      comparisonLevel = 1,
    } = task;

    const indexesOnLevel = mapTaskToGlobalIndexRef.current.get(comparisonLevel);

    if (!indexesOnLevel) {
      throw new Error(`Indexes are not found for level ${comparisonLevel}`);
    }

    const taskIndex = indexesOnLevel.get(id);

    if (typeof taskIndex !== "number") {
      throw new Error(`Index is not found for task ${id}`);
    }

    if (onEditTaskClick) {
      onEditTaskClick(task, taskIndex, (changedTask: TaskOrEmpty) => getMetadata({
        type: "change",
        task: changedTask,
      }));
    } else if (onEditTask && onChangeTasks) {
      onEditTask(task)
        .then((nextTask) => {
          if (!nextTask) {
            return;
          }

          const [,,, suggestions] = getMetadata({
            type: "change",
            task: nextTask,
          });

          const withSuggestions = prepareSuggestions(suggestions);

          withSuggestions[taskIndex] = nextTask;

          onChangeTasks(withSuggestions, {
            type: "edit_task",
          });
        });
    }
  }, [
    onChangeTasks,
    onEditTask,
    onEditTaskClick,
    getMetadata,
    mapTaskToGlobalIndexRef,
    prepareSuggestions,
  ]);

  const handleAddChilds = useCallback((
    parent: Task,
    descendants: readonly TaskOrEmpty[],
  ) => {
    if (!onChangeTasks) {
      return;
    }

    const addedIdsMap = new Map<number, Set<string>>();

    descendants.forEach((descendant) => {
      const {
        id: descendantId,
        comparisonLevel = 1,
      } = descendant;

      const addedIdsAtLevelSet = addedIdsMap.get(comparisonLevel) || new Set<string>();

      addedIdsAtLevelSet.add(descendantId);

      addedIdsMap.set(comparisonLevel, addedIdsAtLevelSet);
    });

    const [
      addedChildsByLevelMap,
      addedRootsByLevelMap,
    ] = getChildsAndRoots(
      descendants,
      (descendant) => {
        const {
          comparisonLevel = 1,
          parent,
        } = descendant;

        if (!parent) {
          return true;
        }

        const addedIdsAtLevelSet = addedIdsMap.get(comparisonLevel);

        if (!addedIdsAtLevelSet) {
          throw new Error(`Ids are not found at level ${comparisonLevel}`);
        }

        return !addedIdsAtLevelSet.has(parent);
      },
    );

    const [, [{ index: taskIndex }], , suggestions] = getMetadata({
      type: "add-childs",
      parent,
      addedIdsMap,
      addedChildsByLevelMap,
      addedRootsByLevelMap,
      descendants,
    });

    const withSuggestions = prepareSuggestions(suggestions);

    descendants.forEach((descendant, index) => {
      const {
        parent: parentId,
        comparisonLevel = 1,
      } = descendant;

      const addedIdsAtLevelSet = addedIdsMap.get(comparisonLevel);

      if (!addedIdsAtLevelSet) {
        throw new Error(`Ids are not found at level ${comparisonLevel}`);
      }

      const nextTask = !parentId || !addedIdsAtLevelSet.has(parentId)
        ? {
          ...descendant,
          parent: parent.id,
        }
        : descendant;

      withSuggestions.splice(taskIndex + 1 + index, 0, nextTask);
    });

    onChangeTasks(withSuggestions, {
      type: "add_tasks",
    });
  }, [
    onChangeTasks,
    getMetadata,
    prepareSuggestions,
  ]);

  const handleAddTask = useCallback((task: Task) => {
    if (onAddTaskClick) {
      onAddTaskClick(task, (newTask: TaskOrEmpty) => getMetadata({
        type: "add-childs",
        parent: task,
        descendants: [newTask],
        addedIdsMap: new Map([
          [
            newTask.comparisonLevel || 1,
            new Set([newTask.id]),
          ],
        ]),
        addedChildsByLevelMap: new Map([
          [
            newTask.comparisonLevel || 1,
            new Map(),
          ],
        ]),
        addedRootsByLevelMap: new Map([
          [
            newTask.comparisonLevel || 1,
            [newTask],
          ],
        ])
      }));
    } else if (onAddTask && onChangeTasks) {
      onAddTask(task)
        .then((nextTask) => {
          if (!nextTask) {
            return;
          }

          handleAddChilds(task, [nextTask]);
        });
    }
  }, [
    handleAddChilds,
    onAddTask,
    onAddTaskClick,
    onChangeTasks,
    getMetadata,
    prepareSuggestions,
  ]);

  const xStep = useMemo(() => {
    const secondDate = getDateByOffset(startDate, 1, viewMode);

    const dateDelta =
      secondDate.getTime() -
      startDate.getTime() -
      secondDate.getTimezoneOffset() * 60 * 1000 +
      startDate.getTimezoneOffset() * 60 * 1000;

    const newXStep = (timeStep * distances.columnWidth) / dateDelta;

    return newXStep;
  }, [
    distances,
    startDate,
    timeStep,
    viewMode,
  ]);

  const onDateChange = useCallback((
    action: BarMoveAction,
    changedTask: Task,
    originalTask: Task,
  ) => {
    const adjustedTask = adjustTaskToWorkingDates({
      action,
      changedTask,
      originalTask,
    });

    const changeAction: ChangeAction = action === "move"
      ? {
        type: "change_start_and_end",
        task: adjustedTask,
        changedTask,
        originalTask,
      }
      : {
        type: "change",
        task: adjustedTask,
      };

    const [
      dependentTasks,
      taskIndexes,
      parents,
      suggestions,
    ] = getMetadata(changeAction);

    const taskIndex = taskIndexes[0].index;

    if (onDateChangeProp) {
      onDateChangeProp(
        adjustedTask,
        dependentTasks,
        taskIndex,
        parents,
        suggestions,
      );
    }

    if (onChangeTasks) {
      const withSuggestions = prepareSuggestions(suggestions);
      withSuggestions[taskIndex] = adjustedTask;
      onChangeTasks(withSuggestions, {
        type: "date_change",
      });
    }
  }, [
    adjustTaskToWorkingDates,
    getMetadata,
    prepareSuggestions,
    onChangeTasks,
    onDateChangeProp,
  ]);

  const onProgressChange = useCallback((task: Task) => {
    const [
      dependentTasks,
      taskIndexes,
    ] = getMetadata({
      type: "change",
      task,
    });

    const taskIndex = taskIndexes[0].index;

    if (onProgressChangeProp) {
      onProgressChangeProp(
        task,
        dependentTasks,
        taskIndex,
      );
    }

    if (onChangeTasks) {
      const nextTasks = [...tasksRef.current];
      nextTasks[taskIndex] = task;
      onChangeTasks(nextTasks, {
        type: "progress_change",
      });
    }
  }, [
    getMetadata,
    onChangeTasks,
    onProgressChangeProp,
    tasksRef,
  ]);

  const [changeInProgress, handleTaskDragStart] = useTaskDrag({
    childTasksMap,
    dependentMap,
    ganttSVGRef,
    mapTaskToCoordinates,
    mapTaskToGlobalIndex,
    onDateChange,
    onProgressChange,
    rtl,
    roundEndDate,
    roundStartDate,
    scrollToLeftStep,
    scrollToRightStep,
    scrollXRef,
    setScrollXProgrammatically,
    svgClientWidthRef,
    svgWidth,
    tasksMap,
    timeStep,
    xStep,
  });

  const {
    tooltipTask,
    tooltipX,
    tooltipY,
    tooltipStrategy,
    setFloatingRef,
    getFloatingProps,
    onChangeTooltipTask,
  } = useTaskTooltip(changeInProgress);

  const handleDeteleTasks = useCallback((tasksForDelete: readonly TaskOrEmpty[]) => {
    if (!onDelete && !onChangeTasks) {
      return;
    }

    onChangeTooltipTask(null, null);
    
    const deletedIdsMap = new Map<number, Set<string>>();

    tasksForDelete.forEach((task) => {
      const {
        id: taskId,
        comparisonLevel = 1,
      } = task;

      const deletedIdsAtLevel = deletedIdsMap.get(comparisonLevel) || new Set<string>();
      deletedIdsAtLevel.add(taskId);

      deletedIdsMap.set(comparisonLevel, deletedIdsAtLevel);
    });

    const [
      dependentTasks,
      taskIndexes,
      parents,
      suggestions,
    ] = getMetadata({
      type: "delete",
      tasks: tasksForDelete,
      deletedIdsMap,
    });

    if (onDelete) {
      onDelete(
        tasksForDelete,
        dependentTasks,
        taskIndexes,
        parents,
        suggestions,
      );
    }

    if (onChangeTasks) {
      let withSuggestions = prepareSuggestions(suggestions);

      suggestions.forEach(([start, end, task, index]) => {
        withSuggestions[index] = {
          ...task,
          start,
          end,
        };
      });

      const deletedIndexesSet = new Set(taskIndexes.map(({ index }) => index));

      withSuggestions = withSuggestions.filter((_, index) => !deletedIndexesSet.has(index));

      onChangeTasks(withSuggestions, {
        type: "delete_task",
        payload: {
          tasks: tasksForDelete,
          taskIndexes: [...deletedIndexesSet],
        },
      });
    }
  }, [
    getMetadata,
    onChangeTasks,
    onDelete,
    prepareSuggestions,
    onChangeTooltipTask,
  ]);

  const handleMoveTaskAfter = useCallback((target: TaskOrEmpty, taskForMove: TaskOrEmpty) => {
    if (!onMoveTaskAfter && !onChangeTasks) {
      return;
    }

    onChangeTooltipTask(null, null);

    const [
      dependentTasks,
      taskIndexes,
      parents,
      suggestions,
    ] = getMetadata({
      type: "move-after",
      target,
      taskForMove,
    });

    const taskIndex = taskIndexes[0].index;

    const {
      id,
      comparisonLevel = 1,
    } = taskForMove;

    const indexesOnLevel = mapTaskToGlobalIndexRef.current.get(comparisonLevel);

    if (!indexesOnLevel) {
      throw new Error(`Indexes are not found for level ${comparisonLevel}`);
    }

    const taskForMoveIndex = indexesOnLevel.get(id);

    if (typeof taskForMoveIndex !== "number") {
      throw new Error(`Index is not found for task ${id}`);
    }

    if (onMoveTaskAfter) {
      onMoveTaskAfter(
        target,
        taskForMove,
        dependentTasks,
        taskIndex,
        taskForMoveIndex,
        parents,
        suggestions,
      );
    }

    if (onChangeTasks) {
      const withSuggestions = prepareSuggestions(suggestions);

      const isMovedTaskBefore = taskForMoveIndex < taskIndex;

      withSuggestions.splice(taskForMoveIndex, 1);
      withSuggestions.splice(isMovedTaskBefore ? taskIndex : (taskIndex + 1), 0, {
        ...taskForMove,
        parent: target.parent,
      });

      onChangeTasks(withSuggestions, {
        type: "move_task_after",
      });
    }
  }, [
    getMetadata,
    onChangeTasks,
    onMoveTaskAfter,
    mapTaskToGlobalIndexRef,
    prepareSuggestions,
    onChangeTooltipTask,
  ]);

  const handleMoveTasksInside = useCallback((parent: Task, childs: readonly TaskOrEmpty[]) => {
    if (!onMoveTaskInside && !onChangeTasks) {
      return;
    }

    onChangeTooltipTask(null, null);

    const {
      comparisonLevel = 1,
    } = parent;

    const indexesAtLevel = mapTaskToGlobalIndexRef.current.get(comparisonLevel);

    if (!indexesAtLevel) {
      throw new Error(`Indexes are not found at level ${comparisonLevel}`);
    }

    const childIndexes: number[] = [];
    const movedIdsMap = new Map<number, Set<string>>();

    childs.forEach((child) => {
      const {
        id: childId,
        comparisonLevel: childComparisonLevel = 1,
      } = child;

      const movedIdsAtLevelSet = movedIdsMap.get(childComparisonLevel) || new Set<string>();
      movedIdsAtLevelSet.add(childId);
      movedIdsMap.set(childComparisonLevel, movedIdsAtLevelSet);

      if (comparisonLevel !== childComparisonLevel) {
        return;
      }

      const childIndex = indexesAtLevel.get(childId);

      if (typeof childIndex !== "number") {
        return;
      }

      childIndexes.push(childIndex);
    });

    const [
      dependentTasks,
      parentIndexes,
      parents,
      suggestions,
    ] = getMetadata({
      type: "move-inside",
      parent,
      childs,
      movedIdsMap,
    });

    const parentIndex = parentIndexes[0].index;

    if (onMoveTaskInside) {
      onMoveTaskInside(
        parent,
        childs,
        dependentTasks,
        parentIndex,
        childIndexes,
        parents,
        suggestions,
      );
    }

    if (onChangeTasks) {
      let withSuggestions = prepareSuggestions(suggestions);

      const parentDisplacement = childIndexes
        .filter((childIndex) => childIndex < parentIndex)
        .length;
      const childIndexesSet = new Set(childIndexes);

      withSuggestions = withSuggestions.filter((_, index) => !childIndexesSet.has(index));

      const startNewChildIndex = parentIndex - parentDisplacement + 1;

      childs.forEach((child, indexInChildsArray) => {
        withSuggestions.splice(startNewChildIndex + indexInChildsArray, 0, {
          ...child,
          parent: parent.id,
        });
      });

      onChangeTasks(withSuggestions, {
        type: "move_task_inside",
      });
    }
  }, [
    getMetadata,
    onChangeTasks,
    onMoveTaskInside,
    mapTaskToGlobalIndexRef,
    prepareSuggestions,
    onChangeTooltipTask,
  ]);

  const fixStartPosition = useCallback<FixPosition>((task, date, index) => {
    if (fixStartPositionProp) {
      fixStartPositionProp(task, date, index);
    }

    if (onChangeTasks) {
      const nextTasks = [...tasksRef.current];
      nextTasks[index] = {
        ...task,
        start: date,
      };

      onChangeTasks(nextTasks, {
        type: "fix_start_position",
      });
    }
  }, [
    fixStartPositionProp,
    onChangeTasks,
    tasksRef,
  ]);

  const fixEndPosition = useCallback<FixPosition>((task, date, index) => {
    if (fixEndPositionProp) {
      fixEndPositionProp(task, date, index);
    }

    if (onChangeTasks) {
      const nextTasks = [...tasksRef.current];
      nextTasks[index] = {
        ...task,
        end: date,
      };

      onChangeTasks(nextTasks, {
        type: "fix_end_position",
      });
    }
  }, [
    fixEndPositionProp,
    onChangeTasks,
    tasksRef,
  ]);

  const onFixDependencyPosition = useCallback<OnDateChange>((
    task,
    dependentTasks,
    taskIndex,
    parents,
    suggestions,
  ) => {
    if (onFixDependencyPositionProp) {
      onFixDependencyPositionProp(
        task,
        dependentTasks,
        taskIndex,
        parents,
        suggestions,
      );
    }

    if (onChangeTasks) {
      const nextTasks = [...tasksRef.current];
      nextTasks[taskIndex] = task;

      onChangeTasks(nextTasks, {
        type: "fix_dependency_position",
      });
    }
  }, [
    onFixDependencyPositionProp,
    onChangeTasks,
    tasksRef,
  ]);

  const handleFixDependency = useCallback((task: Task, delta: number) => {
    const {
      start,
      end,
    } = task;

    const newStart = new Date(start.getTime() + delta);
    const newEnd = new Date(end.getTime() + delta);

    const newChangedTask = {
      ...task,
      start: newStart,
      end: newEnd,
    };

    const [
      dependentTasks,
      taskIndexes,
      parents,
      suggestions,
    ] = getMetadata({
      type: "change",
      task: newChangedTask,
    });

    const taskIndex = taskIndexes[0].index;

    onFixDependencyPosition(
      newChangedTask,
      dependentTasks,
      taskIndex,
      parents,
      suggestions,
    );
  }, [
    getMetadata,
    onFixDependencyPosition,
  ]);

  const onRelationChange = useCallback<OnRelationChange>((from, to, isOneDescendant) => {
    if (onRelationChangeProp) {
      onRelationChangeProp(from, to, isOneDescendant);
    }

    if (onChangeTasks) {
      if (isOneDescendant) {
        return;
      }

      const nextTasks = [...tasksRef.current];

      const [taskFrom, targetFrom, fromIndex] = from;
      const [taskTo, targetTo, toIndex] = to;

      const newDependency: Dependency = {
        sourceId: taskFrom.id,
        sourceTarget: targetFrom,
        ownTarget: targetTo,
      };

      nextTasks[toIndex] = {
        ...taskTo,
        dependencies: taskTo.dependencies
          ? [
            ...taskTo.dependencies.filter(({ sourceId }) => sourceId !== taskFrom.id),
            newDependency,
          ]
          : [newDependency],
      };

      nextTasks[fromIndex] = {
        ...taskFrom,
        dependencies: taskFrom.dependencies
          ? taskFrom.dependencies.filter(({ sourceId }) => sourceId !== taskTo.id)
          : undefined,
      };

      onChangeTasks(nextTasks, {
        type: "relation_change",
      });
    }
  }, [
    onRelationChangeProp,
    onChangeTasks,
    tasksRef,
  ]);

  const onArrowDoubleClick = useCallback(
    (taskFrom: Task, taskTo: Task) => {
      if (!onArrowDoubleClickProp && !onChangeTasks) {
        return;
      }

      const {
        comparisonLevel = 1,
      } = taskFrom;

      const indexesOnLevel = mapTaskToGlobalIndexRef.current.get(comparisonLevel);

      if (!indexesOnLevel) {
        throw new Error(`Indexes are not found for level ${comparisonLevel}`);
      }

      const taskFromIndex = indexesOnLevel.get(taskFrom.id);

      if (typeof taskFromIndex !== "number") {
        throw new Error(`Index is not found for task ${taskFrom.id}`);
      }

      const taskToIndex = indexesOnLevel.get(taskTo.id);

      if (typeof taskToIndex !== "number") {
        throw new Error(`Index is not found for task ${taskTo.id}`);
      }

      if (onArrowDoubleClickProp) {
        onArrowDoubleClickProp(taskFrom, taskFromIndex, taskTo, taskToIndex);
      }

      if (onChangeTasks && isDeleteDependencyOnDoubleClick) {
        const nextTasks = [...tasksRef.current];
        nextTasks[taskToIndex] = {
          ...taskTo,
          dependencies: taskTo.dependencies
            ? taskTo.dependencies.filter(({ sourceId }) => sourceId !== taskFrom.id)
            : undefined,
        };

        onChangeTasks(nextTasks, {
          type: "delete_relation",
          payload: {
            taskFrom,
            taskFromIndex,
            taskTo,
            taskToIndex,
          },
        });
      }
    },
    [
      isDeleteDependencyOnDoubleClick,
      mapTaskToGlobalIndexRef,
      onArrowDoubleClickProp,
      onChangeTasks,
      tasksRef,
    ],
  );

  const handleAction = useHandleAction({
    checkTaskIdExists,
    childTasksMapRef,
    copyIdsMirror,
    copySelectedTasks,
    copyTask,
    cutIdsMirror,
    cutSelectedTasks,
    cutTask,
    handleAddChilds,
    handleDeteleTasks,
    handleMoveTasksInside,
    makeCopies,
    resetSelectedTasks,
    selectedIdsMirror,
    tasksMapRef,
  });

  const [ganttRelationEvent, handleBarRelationStart] = useCreateRelation({
    distances,
    ganttSVGRef,
    mapTaskToCoordinates,
    mapTaskToGlobalIndex,
    onRelationChange,
    rtl,
    taskHalfHeight,
    tasksMap,
    visibleTasks,
  });

  const getTaskCurrentState = useGetTaskCurrentState({
    adjustTaskToWorkingDates,
    changeInProgress,
    isAdjustToWorkingDates,
    isMoveChildsWithParent,
    isRecountParentsOnChange,
    mapTaskToCoordinates,
    minAndMaxChildsMap,
    roundEndDate,
    roundStartDate,
    tasksMap,
  });

  const getTaskCoordinates = useCallback(
    (task: Task) => countTaskCoordinates(getTaskCurrentState(task)),
    [countTaskCoordinates, getTaskCurrentState],
  );

  const contextMenuOptions = useMemo<ContextMenuOptionType[]>(() => {
    if (contextMenuOptionsProp) {
      return contextMenuOptionsProp;
    }

    return [
      cutOption,
      copyOption,
      pasteOption,
      deleteOption,
    ];
  }, [
    contextMenuOptionsProp,
  ]);

  /**
   * Prevent crash after task delete
   */
  const tooltipTaskFromMap = useMemo(() => {
    if (!tooltipTask) {
      return null;
    }

    const {
      id,
      comparisonLevel = 1,
    } = tooltipTask;

    if (changeInProgress) {
      const {
        changedTask,
      } = changeInProgress;

      if (changedTask.id === id && (changedTask.comparisonLevel || 1) === comparisonLevel) {
        return changedTask;
      }
    }

    const tasksMapOnLevel = tasksMap.get(comparisonLevel);

    if (!tasksMapOnLevel) {
      return null;
    }

    const resTask = tasksMapOnLevel.get(id);

    if (!resTask || resTask.type === "empty") {
      return null;
    }

    return resTask;
  }, [tooltipTask, tasksMap, changeInProgress]);

  const additionalLeftSpace = changeInProgress?.additionalLeftSpace || 0;
  const additionalRightSpace = changeInProgress?.additionalRightSpace || 0;

  const additionalStartColumns = useMemo(
    () => Math.ceil(additionalLeftSpace / distances.columnWidth),
    [additionalLeftSpace, distances],
  );

  const [defaultStartColumnIndex, defaultEndColumnIndex] = renderedColumnIndexes || [0, -1];

  const startColumnIndex = defaultStartColumnIndex - additionalStartColumns;
  const endColumnIndex = defaultEndColumnIndex - additionalStartColumns + 1;

  const fullSvgWidth = useMemo(
    () => svgWidth + additionalLeftSpace + additionalRightSpace,
    [
      additionalLeftSpace,
      additionalRightSpace,
      svgWidth,
    ],
  );

  const gridProps: GridProps = useMemo(() => ({
    additionalLeftSpace,
    distances,
    ganttFullHeight,
    isUnknownDates,
    rtl,
    startDate,
    todayColor: colorStyles.todayColor,
    viewMode,
  }), [
    additionalLeftSpace,
    colorStyles.todayColor,
    distances,
    ganttFullHeight,
    isUnknownDates,
    rtl,
    startDate,
    viewMode,
  ]);

  const calendarProps: CalendarProps = useMemo(() => ({
    additionalLeftSpace,
    dateSetup,
    distances,
    endColumnIndex,
    fontFamily,
    fontSize,
    fullSvgWidth,
    getDate,
    isUnknownDates,
    renderBottomHeader,
    renderTopHeader,
    rtl,
    startColumnIndex,
  }), [
    additionalLeftSpace,
    dateSetup,
    distances,
    endColumnIndex,
    fontFamily,
    fontSize,
    fullSvgWidth,
    getDate,
    isUnknownDates,
    renderBottomHeader,
    renderTopHeader,
    rtl,
    startColumnIndex,
  ]);

  const barProps: TaskGanttContentProps = useMemo(() => ({
    additionalLeftSpace,
    additionalRightSpace,
    checkIsHoliday,
    childOutOfParentWarnings,
    childTasksMap,
    colorStyles,
    comparisonLevels,
    criticalPaths,
    dependencyMap,
    dependentMap,
    distances,
    endColumnIndex,
    fixEndPosition,
    fixStartPosition,
    fontFamily,
    fontSize,
    fullRowHeight,
    ganttRelationEvent,
    getDate,
    getTaskCoordinates,
    getTaskGlobalIndexByRef,
    handleBarRelationStart,
    handleDeteleTasks,
    handleFixDependency,
    handleTaskDragStart,
    isShowDependencyWarnings,
    mapGlobalRowIndexToTask,
    onArrowDoubleClick,
    onClick,
    onDoubleClick,
    onFixDependencyPosition,
    onProgressChange,
    onRelationChange,
    renderedRowIndexes,
    rtl,
    selectTaskOnMouseDown,
    selectedIdsMirror,
    setTooltipTask: onChangeTooltipTask,
    startColumnIndex,
    taskHalfHeight,
    taskHeight,
    taskToHasDependencyWarningMap,
    taskToRowIndexMap,
    taskYOffset,
    timeStep,
    visibleTasksMirror,
  }), [
    additionalLeftSpace,
    additionalRightSpace,
    checkIsHoliday,
    childOutOfParentWarnings,
    childTasksMap,
    colorStyles,
    comparisonLevels,
    criticalPaths,
    dependencyMap,
    dependentMap,
    distances,
    endColumnIndex,
    fixEndPosition,
    fixStartPosition,
    fontFamily,
    fontSize,
    fullRowHeight,
    ganttRelationEvent,
    getDate,
    getTaskCoordinates,
    getTaskGlobalIndexByRef,
    handleBarRelationStart,
    handleDeteleTasks,
    handleTaskDragStart,
    isShowDependencyWarnings,
    mapGlobalRowIndexToTask,
    mapTaskToCoordinates,
    onArrowDoubleClick,
    onChangeTooltipTask,
    onClick,
    onDoubleClick,
    onFixDependencyPosition,
    onProgressChange,
    onRelationChange,
    renderedRowIndexes,
    rtl,
    selectTaskOnMouseDown,
    selectedIdsMirror,
    startColumnIndex,
    taskHalfHeight,
    taskHeight,
    taskToHasDependencyWarningMap,
    taskToRowIndexMap,
    taskYOffset,
    timeStep,
    visibleTasks,
    visibleTasksMirror,
  ]);

  const tableProps: TaskListProps = {
    TaskListHeader,
    TaskListTable,
    canMoveTasks,
    canResizeColumns,
    childTasksMap,
    closedTasks,
    colors: colorStyles,
    columnResizeEvent,
    columns,
    cutIdsMirror,
    dateSetup,
    dependencyMap,
    distances,
    fontFamily,
    fontSize,
    fullRowHeight,
    ganttFullHeight,
    ganttHeight,
    getTaskCurrentState,
    handleAddTask,
    handleDeteleTasks,
    handleEditTask,
    handleMoveTaskAfter,
    handleMoveTasksInside,
    handleOpenContextMenu,
    icons,
    isShowTaskNumbers,
    mapTaskToNestedIndex,
    onColumnResizeStart,
    onExpanderClick: handleExpanderClick,
    onTableResizeStart,
    scrollToBottomStep,
    scrollToTopStep,
    selectTaskOnMouseDown,
    selectedIdsMirror,
    scrollToTask,
    tableWidth,
    taskListContainerRef,
    taskListRef,
    taskListWidth,
    tasks: visibleTasks,
  };

  return (
    <div
      className={styles.wrapper}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={wrapperRef}
    >
      {(columns.length > 0) && <TaskList {...tableProps} />}

      <TaskGantt
        barProps={barProps}
        calendarProps={calendarProps}
        fullRowHeight={fullRowHeight}
        fullSvgWidth={fullSvgWidth}
        ganttFullHeight={ganttFullHeight}
        ganttHeight={ganttHeight}
        ganttSVGRef={ganttSVGRef}
        gridProps={gridProps}
        horizontalContainerRef={horizontalContainerRef}
        onVerticalScrollbarScrollX={onVerticalScrollbarScrollX}
        verticalGanttContainerRef={verticalGanttContainerRef}
      />

      {tooltipTaskFromMap && (
        <Tooltip
          tooltipX={tooltipX}
          tooltipY={tooltipY}
          tooltipStrategy={tooltipStrategy}
          setFloatingRef={setFloatingRef}
          getFloatingProps={getFloatingProps}
          fontFamily={fontFamily}
          fontSize={fontSize}
          task={tooltipTaskFromMap}
          TooltipContent={TooltipContent}
        />
      )}

      <VerticalScroll
        ganttFullHeight={ganttFullHeight}
        ganttHeight={ganttHeight}
        headerHeight={distances.headerHeight}
        isChangeInProgress={Boolean(changeInProgress)}
        onScroll={onVerticalScrollbarScrollY}
        rtl={rtl}
        verticalScrollbarRef={verticalScrollbarRef}
      />

      <ContextMenu
        checkHasCopyTasks={checkHasCopyTasks}
        checkHasCutTasks={checkHasCutTasks}
        colors={colorStyles}
        contextMenu={contextMenu}
        distances={distances}
        handleAction={handleAction}
        handleCloseContextMenu={handleCloseContextMenu}
        options={contextMenuOptions}
      />
    </div>
  );
};
