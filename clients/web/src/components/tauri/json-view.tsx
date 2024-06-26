import { findLineNumberByKey } from "~/lib/tauri/tauri-conf-lib";
import { useConfiguration } from "./configuration-context";
import { Show, Suspense } from "solid-js";
import { Loader } from "../loader";
import { useParams } from "@solidjs/router";
import { retrieveConfigurationByKey } from "~/lib/tauri/config/retrieve-configurations";
import { CodeHighlighter } from "../code-highlighter";

export function JsonView() {
  const params = useParams<{ config: string }>();
  const config = () => retrieveConfigurationByKey(params.config);

  const {
    highlightKey: { highlightKey },
  } = useConfiguration();

  const lineNumber = () => findLineNumberByKey(highlightKey());

  return (
    <Show when={params.config}>
      <Show
        when={config() && config()?.key !== "loaded"}
        fallback={
          <div class="h-full grid gap-4 text-center content-center justify-center items-center border-l p-4 border-gray-800">
            This configuration is parsed and merged, so there is no direct
            source file to display.
          </div>
        }
      >
        <div class="min-h-full h-max min-w-full w-max bg-black bg-opacity-50">
          <Suspense fallback={<Loader />}>
            <CodeHighlighter
              text={config()?.raw}
              lang="json"
              highlightedLine={lineNumber()}
            />
          </Suspense>
        </div>
      </Show>
    </Show>
  );
}
