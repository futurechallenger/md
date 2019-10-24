import { ab2str, str2ab } from '../src/lib/utils';

describe('test util methods', () => {
  test('Array buffer from/to string', () => {
    const str = 'hello world!';

    const buf = str2ab(str);
    const ret = ab2str(buf as any);

    expect(str).toEqual(ret);
  });
});
