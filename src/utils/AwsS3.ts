import AWS from "aws-sdk";

export class AwsS3 {
  private readonly _S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  });

  get S3(): AWS.S3 {
    return this._S3;
  }
}
