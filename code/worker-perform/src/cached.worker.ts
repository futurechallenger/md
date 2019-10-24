/**
 * A worker with cache to improve performance
 */
import { reverseString } from './lib/reverse_string';
import { DataType } from './index';
import { ab2str, str2ab } from './lib/utils';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { dataBuff } = event.data;
  const dataStr = ab2str(dataBuff);
  const target = JSON.parse(dataStr || '[]');
  const processed: DataType[] = [];

  for (let d of target) {
    const { key, val } = d;
    processed.push({ key, val: reverseString(val) });
  }

  ctx.postMessage(str2ab(JSON.stringify(processed)));

  self.close();
};

ctx.onerror = (event: ErrorEvent): any => {
  console.error('Error in worker', event);
  self.close();
};

export default null as any;
