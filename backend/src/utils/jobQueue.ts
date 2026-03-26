export type Job<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export class JobQueue {
  private readonly concurrency: number;
  private running = 0;
  private queue: Array<Job<unknown>> = [];

  constructor(concurrency: number) {
    this.concurrency = Math.max(1, concurrency);
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const job: Job<T> = { fn, resolve, reject };
      this.queue.push(job as Job<unknown>);
      void this.pump();
    });
  }

  private async pump(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) return;
      this.running += 1;
      try {
        const result = await job.fn();
        job.resolve(result);
      } catch (err) {
        job.reject(err);
      } finally {
        this.running -= 1;
      }
    }
  }
}

