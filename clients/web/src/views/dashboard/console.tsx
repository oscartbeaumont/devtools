import {
  createSignal,
  untrack,
  createEffect,
  For,
  Setter,
  Show,
} from "solid-js";
import { FilterToggle } from "~/components/filter-toggle";
import { Toolbar } from "~/components/toolbar";
import { useMonitor } from "~/context/monitor-provider";
import { createStore } from "solid-js/store";
import { LogFilterObject, filterLogs } from "~/lib/console/filter-logs";
import { LogLevelFilter } from "~/components/console/log-level-filter";
import { NoLogs } from "~/components/console/no-logs";
import { LogEvent } from "~/components/console/log-event";
import type { LogEvent as ILogEvent } from "~/lib/proto/logs";
import { VirtualList } from "~/components/virtual-list";

export default function Console() {
  const { monitorData } = useMonitor();
  const [showAttributes, toggleAttributes] = createSignal(true);
  const [showTimestamp, toggleTimeStamp] = createSignal(true);
  const [shouldAutoScroll, toggleAutoScroll] = createSignal<boolean>(true);

  const filterToggles: { label: string; setter: Setter<boolean> }[] = [
    {
      label: "Attributes",
      setter: toggleAttributes,
    },
    {
      label: "Timestamps",
      setter: toggleTimeStamp,
    },
    {
      label: "Autoscroll",
      setter: toggleAutoScroll,
    },
  ];

  const initialFilters = () => ({
    textContent: "",
    levels: [0, 1, 2, 3, 4],
  });

  const [filter, setFilter] = createStore<LogFilterObject>(initialFilters());

  const [filteredLogs, setFilteredLogs] = createSignal<ILogEvent[]>([]);

  // If the filter changes we want to do a full filter on the list
  createEffect(() => {
    setFilteredLogs(
      filterLogs(
        untrack(() => monitorData),
        filter,
        untrack(() => monitorData.logs),
      ),
    );
  });

  // If there is new logs coming in, we only want to perform filtering on the newly received logs
  createEffect((oldLength: number) => {
    const newLength = monitorData.logs.length;

    // Partial filter
    if (newLength > oldLength) {
      const metadata = untrack(() => monitorData);
      const alreadyFilteredLogs = untrack(() => filteredLogs());
      setFilteredLogs(
        alreadyFilteredLogs.concat(
          filterLogs(
            metadata,
            untrack(() => filter),
            monitorData.logs.slice(oldLength - 1, newLength - 1),
          ),
        ),
      );
    }

    return newLength;
  }, 0);

  const resetFilter = () => setFilter(initialFilters);

  return (
    <>
      <Toolbar>
        <div>({filteredLogs().length})</div>
        <input
          value={filter.textContent}
          onInput={(e) =>
            setFilter(() => ({ ...filter, textContent: e.currentTarget.value }))
          }
          type="text"
          placeholder="Filter..."
          class="bg-slate-900 px-1 rounded text-white focus:outline-none focus:border focus:border-slate-400"
        />
        <LogLevelFilter filter={filter} setFilter={setFilter} />
        <For each={filterToggles}>
          {(filterToggle) => (
            <FilterToggle
              defaultPressed
              aria-label={filterToggle.label}
              changeHandler={() => filterToggle.setter((prev) => !prev)}
            >
              <span>{filterToggle.label}</span>
            </FilterToggle>
          )}
        </For>
      </Toolbar>

      <Show
        when={filteredLogs() && filteredLogs().length > 0}
        fallback={<NoLogs filter={filter} reset={resetFilter} />}
      >
        <VirtualList
          class="h-[calc(100%-var(--toolbar-height))]"
          dataStream={filteredLogs()}
          shouldAutoScroll={shouldAutoScroll()}
          estimateSize={28}
          overscan={25}
        >
          {(item, index) => (
            <LogEvent
              event={item}
              odd={Boolean(index & 1)}
              showLinks={true}
              showAttributes={showAttributes()}
              showTimestamp={showTimestamp()}
            />
          )}
        </VirtualList>
      </Show>
    </>
  );
}
