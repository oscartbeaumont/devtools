import { createContext, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { HealthClient } from "~/lib/proto/health.client";
import { InstrumentClient } from "~/lib/proto/instrument.client";
import { TauriClient } from "~/lib/proto/tauri.client";
import {SourcesClient} from "~/lib/proto/sources.client.ts";

export function connect(url: string) {
  const abortController = new AbortController();
  const transport = new GrpcWebFetchTransport({
    format: "binary",
    baseUrl: url,
    abort: abortController.signal,
  });

  const instrumentClient = new InstrumentClient(transport);
  const tauriClient = new TauriClient(transport);
  const healthClient = new HealthClient(transport);
  const sourcesClient = new SourcesClient(transport);

  return {
    abortController,
    client: {
      tauri: tauriClient,
      health: healthClient,
      instrument: instrumentClient,
      sources: sourcesClient
    },
  };
}

export type Connection = ReturnType<typeof connect>;

export function disconnect(controller: AbortController, goto = "/") {
  const navigate = useNavigate();

  controller.abort();

  navigate(goto);
}

export const TransportContext = createContext<{
  transport: GrpcWebFetchTransport;
  abort: AbortController;
}>();

export function useTransport() {
  const ctx = useContext(TransportContext);

  if (!ctx) throw new Error("can not find TransportContext.Provider");
  return ctx;
}
