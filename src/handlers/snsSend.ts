import AWS from 'aws-sdk'

const snsClient = new AWS.SNS()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendSnsMessage = async (msgObj: any, topicUrl: string) => {
  const snsMsg = {
    Message: JSON.stringify(msgObj),
    TopicArn: topicUrl,
  }
  return await snsClient.publish(snsMsg)
}
