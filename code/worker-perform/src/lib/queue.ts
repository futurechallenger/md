interface Task {
  run(): void;
}
class TaskQueue {
  private _queue: Task[];

  constructor() {
    this._queue = new Array<Task>();
  }

  private _startExec() {
    const task = this._queue.shift();
    if (task) task.run();
  }

  next() {
    if (this._queue.length === 0) {
      return;
    }

    this._startExec();
  }

  async addTask(
    fun: (param: any) => any,
    data: any,
    resolve: (val: any) => void,
    reject: (err: any) => void,
  ) {
    const run = async () => {
      try {
        const ret = await fun(data);
        resolve(ret);
      } catch (e) {
        reject(e);
      }

      this.next();
    };

    this._queue.push({ run } as Task);
    this._startExec();
  }
}

export { TaskQueue };
