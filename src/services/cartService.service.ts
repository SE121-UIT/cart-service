import { createChannel } from '../core/messageBroker';
import { generateCorrelationId } from '../utils/generate';

export const requestQuantityCheck = async (productId: string): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    const channel = await createChannel();

    await channel.assertExchange('ONLINE_SHOPPING_CART', 'direct', {
      durable: true,
    });
    const correlationId = generateCorrelationId();

    const q = await channel.assertQueue('', {
      exclusive: true,
    });

    channel.bindQueue(q.queue, 'ONLINE_SHOPPING_CART', 'INVENTORY_SERVICE');
    channel.consume(
      q.queue,
      (msg) => {
        if (msg?.properties.correlationId === correlationId) {
          const result = JSON.parse(msg.content.toString());
          console.log(
            `Received quantity check result for product ${result.productId}: ${result.quantity}`
          );
          resolve(result.quantity);
        }
      },
      { noAck: true }
    );

    const message = JSON.stringify({ productId });
    channel.publish('ONLINE_SHOPPING_CART', 'INVENTORY_SERVICE', Buffer.from(message), {
      correlationId,
      replyTo: q.queue,
    });
  });
};
