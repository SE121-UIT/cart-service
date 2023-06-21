import { createChannel } from '../core/messageBroker';
import { generateCorrelationId } from '../utils/generate';
import createError from 'http-errors';

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

export enum BusinessErrors {
  PRODUCTID_NOT_EXIST = 'PRODUCTID_NOT_EXIST',
}

export type EventBroker = {
  name: EventTypeBroker;
  data: object | undefined;
};

export type ProductIdCheckReplyEvent = EventBroker & {
  data: {
    productId: string;
    result: boolean;
  };
};

export enum EventTypeBroker {
  PRODUCT_ID_CHECK = 'product_id_check',
  PRODUCT_ID_CHECK_REPLY = 'product_id_check_reply',
  CART_CONFIRMATION = 'cart_confirmation',
  CART_CONFIRMATION_REPLY = 'cart_confirmation_reply',
}

export const requestProductIdExist = async (productId: string): Promise<boolean> => {
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
        if (msg?.content) {
          if (msg?.properties.correlationId === correlationId) {
            const eventData: ProductIdCheckReplyEvent = JSON.parse(msg.content.toString());
            if (eventData.name === EventTypeBroker.PRODUCT_ID_CHECK_REPLY) {
              const result = eventData.data.result;
              resolve(result);
            }
          }
        }
      },
      { noAck: true }
    );

    const payload: EventBroker = {
      name: EventTypeBroker.PRODUCT_ID_CHECK,
      data: {
        productId,
      },
    };

    const message = JSON.stringify(payload);
    channel.publish('ONLINE_SHOPPING_CART', 'INVENTORY_SERVICE', Buffer.from(message), {
      correlationId,
      replyTo: q.queue,
    });
  });
};

export const assertProductIdExist = async (productId: string) => {
  const isExist = await requestProductIdExist(productId);
  if (!isExist) {
    throw createError.NotFound(BusinessErrors.PRODUCTID_NOT_EXIST);
  }
};
