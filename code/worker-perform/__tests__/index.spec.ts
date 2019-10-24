import { prepareData } from '../src/index';

describe('Test index', () => {
  test('Test pareparation of data', () => {
    const data = prepareData(5);

    expect(data.length).toBe(5);
    expect(data[0].val !== data[data.length - 1].val).toBe(true);
  });
});
