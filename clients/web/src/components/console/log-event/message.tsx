import type { ProcessedLogEvent } from "~/lib/console/process-log-event-for-view";
import { Show } from "solid-js";
import { A } from "@solidjs/router";
import MigrateAlt from "~/components/icons/migrate--alt";
import { useConnection } from "~/context/connection-provider";

export function Message(props: {
  processedEvent: ProcessedLogEvent;
  showLinks: boolean | undefined;
}) {
  const {
    connectionStore: { host, port },
  } = useConnection();

  return (
    <Show when={props.processedEvent.message.length}>
      <span class="group-hover:text-white text-slate-300 transition-colors relative">
        <Show when={props.showLinks && props.processedEvent.parent}>
          <A
            href={`/dash/${host}/${port}/calls?span=${props.processedEvent.parent}`}
            class="text-slate-400 group-hover:text-white absolute -left-6 top-1/2 -translate-y-1/2"
          >
            <span class="size-4 hover:scale-125 inline-block">
              <MigrateAlt />
            </span>
          </A>
        </Show>
        {props.processedEvent.message}
      </span>
    </Show>
  );
}
