// src/lib/exampleLoader.ts
import { EXAMPLE_ENABLED } from "./constants";

interface ExamplePayload {
  metadataName: string;
  metadataDescription?: string;
  fields: unknown[];
}

export const EXAMPLES: Record<string, ExamplePayload> = EXAMPLE_ENABLED
  ? Object.fromEntries(
      Object.entries(
        // use only { eager: true } – fully typed
        import.meta.glob("../examples/*.json", { eager: true }),
      ).map(([path, mod]) => {
        const obj = (mod as { default: ExamplePayload }).default; // 👈 cast
        const id = path.split("/").pop()!.replace(".json", "");
        return [id, obj];
      }),
    )
  : {};
