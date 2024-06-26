import { Metadata_Level } from "~/lib/proto/common";
import { SpanTreeEntry } from "~/lib/span/span-tree-entries";
import { FilterToggle } from "~/components/filter-toggle";
import { For, Setter } from "solid-js";
import { Trace } from "./traces/trace";
import { computeDurationsFromSpanTreeArray } from "~/lib/calls/compute-durations-from-span-tree-array";

export function Traces(props: {
  minLevel: Metadata_Level;
  setMinLevel: Setter<Metadata_Level>;
  spanChildren: SpanTreeEntry[];
}) {
  const closedSpans = () =>
    props.spanChildren.filter((s) => s.span.closedAt > 0);

  const durations = () => computeDurationsFromSpanTreeArray(closedSpans());

  return (
    <div class="grid gap-2">
      <h2 class="text-xl p-4">Trace ({props.spanChildren.length})</h2>
      <div class="items-center flex justify-end h-toolbar p-2 gap-4">
        <FilterToggle
          defaultPressed={props.minLevel > Metadata_Level.DEBUG}
          aria-label="attributes"
          changeHandler={() =>
            props.setMinLevel((prev) =>
              prev == Metadata_Level.TRACE
                ? Metadata_Level.DEBUG
                : Metadata_Level.TRACE,
            )
          }
        >
          <span>Show trace level</span>
        </FilterToggle>
      </div>
      <table>
        <thead>
          <tr class="uppercase border-gray-800 border-b">
            <th>Name</th>
            <th>Waterfall</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.spanChildren}>
            {({ depth, span }) => (
              <Trace depth={depth} span={span} durations={durations()} />
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
