import tauriConfigSchemaV1 from "./tauri-conf-schema-v1.json";
import tauriConfigSchemaV2 from "./tauri-conf-schema-v2.json";
import { Draft07, JsonSchema, JsonPointer } from "json-schema-library";
import { createResource, Signal } from "solid-js";
import { useRouteData, useLocation, useParams } from "@solidjs/router";
import { awaitEntries, getEntryBytes } from "~/lib/sources/file-entries";
import { useConfiguration } from "~/components/tauri/configuration-context";
import { unwrap, reconcile } from "solid-js/store";
import { bytesToText } from "../code-highlight";
import { useConnection } from "~/context/connection-provider";
import { useMonitor } from "~/context/monitor-provider";

export type configurationStore = {
  configs?: configurationObject[];
};

export type configurationObject = {
  path: string;
  data: tauriConfiguration;
  size: number;
  raw: string;
};

export type tauriConfiguration = Record<
  "build" | "package" | "plugins" | "tauri",
  object
>;

export function getTauriTabBasePath() {
  const { pathname } = useLocation();
  return pathname
    .split("/")
    .slice(
      0,
      pathname.split("/").findIndex((e) => e === "tauri")
    )
    .concat("tauri")
    .join("/");
}

function createDeepConfigurationStoreSignal<T>(): Signal<T> {
  const {
    configurations: { configurations, setConfigurations },
  } = useConfiguration();
  return [
    () => configurations.configs,
    (v: T) => {
      const unwrapped = unwrap(configurations.configs);
      typeof v === "function" && (v = v(unwrapped));
      setConfigurations("configs", reconcile(v as configurationObject[]));
      return configurations.configs;
    },
  ] as Signal<T>;
}

export function retrieveConfigurationByPathAndKey(
  path: string,
  key: "build" | "package" | "plugins" | "tauri"
) {
  const [configs] = retrieveConfigurations();
  return configs()?.find(
    (config) =>
      config?.path === path &&
      config.data &&
      Object.prototype.hasOwnProperty.call(config.data, key)
  )?.data[key];
}

export function retrieveConfigurations() {
  const {
    configurations: { configurations },
  } = useConfiguration();

  if (configurations.configs)
    return createResource(() => configurations.configs);

  const { connectionStore } = useConnection();
  const [entries] = awaitEntries(connectionStore.client.sources, "");

  return createResource(
    entries,
    async (entries) => {
      const filteredEntries =
        entries?.filter((e) => e.path.endsWith(".conf.json")) || [];
      return await Promise.all(
        filteredEntries.map(async (e): Promise<configurationObject> => {
          const bytes = await getEntryBytes(
            connectionStore.client.sources,
            e.path,
            Number(e.size)
          );

          const text = bytesToText(bytes);
          const data = JSON.parse(text);
          delete data["$schema"];
          return {
            path: e.path,
            data: (data as tauriConfiguration) ?? {},
            size: Number(e.size),
            raw: text,
          };
        })
      );
    },
    {
      storage: createDeepConfigurationStoreSignal,
    }
  );
}

// version: semver
export function returnLatestSchemaForVersion(version: string) {
  version = version.split(".")[0];
  switch (version) {
    case "1":
      return tauriConfigSchemaV1;
    case "2":
      return tauriConfigSchemaV2;
    default:
      return tauriConfigSchemaV1;
  }
}

export function getDescriptionByKey(key: string) {
  const {
    descriptions: { descriptions },
  } = useConfiguration();
  return descriptions().has(key) ? descriptions().get(key) : undefined;
}

export function scrollToHighlighted() {
  const highlightedLine = document.querySelector(".line.highlighted");

  if (!highlightedLine) return;

  highlightedLine.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function findLineNumberByKey(key: string) {
  const {
    configurations: { configurations },
  } = useConfiguration();

  const params = useParams<{ config: string }>();

  const config = configurations.configs?.find((x) => x.path === params.config);

  return findLineNumberByNestedKeyInSource(config?.raw ?? "", key);
}

export function findLineNumberByNestedKeyInSource(
  jsonString: string,
  nestedKeyPath: string
): number {
  const lines = jsonString.split("\n");
  if (nestedKeyPath === "" || nestedKeyPath === undefined) return -1;
  const searchStack = nestedKeyPath.split(".");
  // Number of whitespaces used for indentation
  const Indent = 2;

  let currentLine = 1;
  const keyStack: string[] = [];
  const searchIndents: number[] = [0];
  let searchLevel = 0;

  let arrayCounter = 0;

  for (const line of lines) {
    const currentIndent = line.length - line.trimStart().length;
    // If a property is closed we move up a level
    if (keyStack.length > 0 && searchIndents[searchLevel] === currentIndent) {
      keyStack.pop();
      searchLevel--;
      searchIndents.pop();
      arrayCounter = 0;
    }

    // We make sure we only move into nested properties if the indent is correct
    if (
      searchIndents[searchLevel] === 0 ||
      searchIndents[searchLevel] + Indent === currentIndent ||
      searchIndents[searchLevel] + Indent + Indent === currentIndent
    ) {
      // If the search property matches we move down a level
      if (line.includes('"' + searchStack[searchLevel] + '":')) {
        keyStack.push(searchStack[searchLevel]);
        searchLevel++;
        searchIndents.push(currentIndent);
      }

      // If the search property is a number we are in an array and assume that we are in the correct spot and only have to search for the correct index
      if (Number.isInteger(parseInt(searchStack[searchLevel]))) {
        if (arrayCounter === parseInt(searchStack[searchLevel])) {
          keyStack.push(searchStack[searchLevel]);
          searchLevel++;
          searchIndents.push(currentIndent);
        } else {
          arrayCounter++;
        }
      }
    }

    if (keyStack.length === searchStack.length) {
      return currentLine;
    }
    currentLine++;
  }

  return -1; // Return -1 if the nested key is not found in the JSON string.
}

export function generateDescriptions(key: string, data: object) {
  const { monitorData } = useMonitor();

  const {
    descriptions: { setDescriptions },
  } = useConfiguration();

  setDescriptions(
    buildSchemaMap(monitorData.schema ?? {}, {
      [key]: data,
    })
  );
}

export function buildSchemaMap(baseSchema: JsonSchema, data: object) {
  const jsonSchema = new Draft07(baseSchema);
  const map = new Map();

  const buildMap = (
    schema: JsonSchema,
    value: unknown,
    pointer: JsonPointer
  ) => {
    //schema = jsonSchema.compileSchema(schema);
    pointer = pointer.replace("#/", "").replace("#", "").replaceAll("/", ".");
    map.set(pointer, schema);
  };

  jsonSchema.each(data, buildMap);

  return map;
}