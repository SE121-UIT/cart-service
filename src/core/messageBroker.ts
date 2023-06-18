import amqplib, { Channel } from 'amqplib';

export const publishMessage = (channel: Channel, routingKey: string, msg: string) => {
  channel.publish('ONLINE_SHOPPING_CART', routingKey, Buffer.from(msg));
  console.log('Sent', msg);
};

const channelSingleton = (() => {
  let instance: Channel | null = null;

  async function createChannel(): Promise<Channel> {
    try {
      if (!instance) {
        const connection = await amqplib.connect(
          'amqps://nlpghfsl:tAsRiPJT9G5avar1fwH-ahUvJkRncdRX@gerbil.rmq.cloudamqp.com/nlpghfsl'
        );
        instance = await connection.createChannel();
        await instance.assertQueue('ONLINE_SHOPPING_CART', {
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
