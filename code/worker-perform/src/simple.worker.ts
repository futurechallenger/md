import { reverseString } from './lib/reverse_string';
import { DataType } from './index';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { target } = event.data as { target: DataType[] };
  for (let el of target) {
    const { val } = el;
    reverseString(val);
  }

  ctx.postMessage('done');

  // Close the worker when jobs done
  self.close();
};

ctx.onerror = (event: ErrorEvent): any => {
  console.error('Error in worker', event.message);
  self.close();
};

export default null as any;
