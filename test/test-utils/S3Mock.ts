import Faker from "faker";

export class S3Mock {
  private _S3 = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get S3(): { upload: any } {
    return {
      upload: jest.fn().mockResolvedValue({
        promise: async () => ({
          Location: Faker.internet.url(),
        }),
      }),
    };
  }
}
