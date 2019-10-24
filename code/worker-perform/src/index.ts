// TODO: try this in main thread

import RandomString from 'randomstring';
import SimpleWorker from './simple.worker';
import CachedWorker from './cached.worker';
import { TaskQueue } from './lib/queue';
import { reverseString } from './lib/reverse_string';
import { LRUCache } from './lib/lru_cache';
import { ab2str, str2ab } from './lib/utils';

type DataType = {
  key: string;
  val: string;
};

const ITERATE_COUNT = 100000;
const STR_LEN = 300;
// const cache = new LRUCache<string, string>(ITERATE_COUNT / 10);

let queue: TaskQueue | null = null;

function prepareData(count: number = 1000, length: number = 10) {
  const data: Array<DataType> = [];
  for (let i = 0; i < count; i++) {
    const item = RandomString.generate(length);
    data.push({ key: `Key - ${i}`, val: item });
  }

  return data;
}

const rawData = prepareData(ITERATE_COUNT, STR_LEN);
(window as any).rawData = rawData;

// Demo 1: execute reverse string in ui thread
function execTaskSync() {
  console.time('sync task in ui thread');

  const target = rawData;
  for (let el of target) {
    const { val } = el;
    reverseString(val);
  }

  console.timeEnd('sync task in ui thread');
}

(window as any).execTaskSync = execTaskSync;

async function execQueueTask(): Promise<void> {
  console.time('===>work with queue');
  // Use a queue to execute tasks asynchronously
  if (!queue) queue = new TaskQueue();

  return new Promise((resolve, reject) => {
    if (queue) {
      queue.addTask(
        (target: DataType[]): string => {
          for (let el of target) {
            const { val } = el;
            reverseString(val);
          }

          console.timeEnd('===>work with queue');
          return 'done';
        },
        rawData,
        resolve,
        reject,
      );
    } else {
      reject(new Error('Queue is empty!!!'));
    }
  });
}

(window as any).execQueueTask = execQueueTask;

const dataCache = new LRUCache<string, DataType>(ITERATE_COUNT / 10);

function execInWorkerWithBuffer() {
  const data = rawData;

  console.time('buffer worker');

  const dataStr = JSON.stringify(data);
  const dataBuff = str2ab(dataStr);

  const worker = new CachedWorker();
  worker.postMessage(dataBuff, [dataBuff]);

  worker.onmessage = (event: MessageEvent) => {
    console.timeEnd('buffer worker');

    const processed = JSON.parse(ab2str(event.data) || '[]');
  };
  worker.onerror = (event: ErrorEvent) => {
    console.log('===>Worker error', event);
  };
}

(window as any).execInWorkerWithBuffer = execInWorkerWithBuffer;

/**
 * Everytime send a object to worker to revert it.
 */
function execWorkerTask() {
  console.time('worker');
  const worker = new SimpleWorker();

  worker.postMessage({ target: rawData });
  worker.onmessage = (event: MessageEvent) => {
    console.timeEnd('worker');
  };
  worker.onerror = (event: ErrorEvent) => {
    console.log('===>Worker error', event);
    console.timeEnd('worker');
  };
}

(window as any).execWorkerTask = execWorkerTask;

export { prepareData, DataType };
