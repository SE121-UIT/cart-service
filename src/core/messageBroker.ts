import amqplib, { Channel } from 'amqplib';
import { RABBIT_MQ_URL, EXCHANGE_NAME } from '../configs';

export const publishMessage = (channel: Channel, routingKey: string, msg: string) => {
  channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(msg));
  console.log('Sent', msg);
};

const channelSingleton = (() => {
  let instance: Channel | null = null;

  async function createChannel(): Promise<Channel> {
    try {
      if (!instance) {
        const connection = await amqplib.connect(RABBIT_MQ_URL);
        instance = await connection.createChannel();
        await instance.assertQueue(EXCHANGE_NAME, {
          durable: true,
        });
      }
      return instance;
    } catch (err) {
      throw err;
    }
  }

  return {
    getInstance: function (): Promise<Channel> {
      if (!instance) {
        return createChannel();
      }
      return Promise.resolve(instance);
    },
  };
})();

export const createChannel = channelSingleton.getInstance;
