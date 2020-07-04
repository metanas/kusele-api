import AWS from "aws-sdk";

export class AwsS3 {
  private _S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
  });

  get S3(): AWS.S3 {
    return this._S3;
  }
}
