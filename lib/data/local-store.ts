import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedStore, type LocalStore } from "@/lib/data/seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_PATH = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readStore(): Promise<LocalStore> {
  try {
    const raw = await readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    const seed = createSeedStore();
    await persist(seed);
    return seed;
  }
}

async function persist(store: LocalStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store), "utf8");
  await rename(tmp, DATA_PATH);
}

export async function withLocalStore<T>(
  mutator: (store: LocalStore) => T | Promise<T>,
  options: { mutate?: boolean } = {}
): Promise<T> {
  return enqueue(async () => {
    const store = await readStore();
    const result = await mutator(store);
    if (options.mutate) {
      await persist(store);
    }
    return result;
  });
}

export async function resetLocalStore() {
  return enqueue(async () => {
    const seed = createSeedStore();
    await persist(seed);
    return seed;
  });
}
