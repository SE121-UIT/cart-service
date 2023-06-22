import { createChannel } from '../core/messageBroker';
import { generateCorrelationId } from '../utils/generate';
import createError from 'http-errors';
import { ProductItem } from '../shoppingCarts/productItem';
import { EXCHANGE_NAME, INVENTORY_SERVICE } from '../configs';

export enum BusinessErrors {
  PRODUCTID_NOT_EXIST = 'PRODUCTID_NOT_EXIST',
}

export type EventBroker = {
  name: EventTypeBroker;
  data: object | undefined;
};

export type ProductIdCheckEvent = EventBroker & {
  data: {
    productId: string;
  };
};

export type CartConfirmationEvent = EventBroker & {
  data: {
    productItems: ProductItem[];
  };
};

export type ProductIdCheckReplyEvent = EventBroker & {
  data: {
    productId: string;
    result: boolean;
  };
};

export type CartConfirmationReplyEvent = EventBroker & {
  data: {
    message: string;
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

    await channel.assertExchange(EXCHANGE_NAME, 'direct', {
      durable: true,
    });
    const correlationId = generateCorrelationId();

    const q = await channel.assertQueue('', {
      exclusive: true,
    });

    channel.bindQueue(q.queue, EXCHANGE_NAME, INVENTORY_SERVICE);
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

    const payload: ProductIdCheckEvent = {
      name: EventTypeBroker.PRODUCT_ID_CHECK,
      data: {
        productId,
      },
    };

    const message = JSON.stringify(payload);
    channel.publish(EXCHANGE_NAME, INVENTORY_SERVICE, Buffer.from(message), {
      correlationId,
      replyTo: q.queue,
    });
  });
};

export const requestConfirmCart = async (
  productItems: ProductItem[]
): Promise<{ message: string; result: boolean }> => {
  return new Promise(async (resolve, reject) => {
    const channel = await createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'direct', {
      durable: true,
    });
    const correlationId = generateCorrelationId();

    const q = await channel.assertQueue('', {
      exclusive: true,
    });

    channel.bindQueue(q.queue, EXCHANGE_NAME, INVENTORY_SERVICE);
    channel.consume(
      q.queue,
      (msg) => {
        if (msg?.content) {
          if (msg?.properties.correlationId === correlationId) {
            const eventData: CartConfirmationReplyEvent = JSON.parse(msg.content.toString());
            if (eventData.name === EventTypeBroker.CART_CONFIRMATION_REPLY) {
              const result = eventData.data;
              resolve(result);
            }
          }
        }
      },
      { noAck: true }
    );

    const payload: CartConfirmationEvent = {
      name: EventTypeBroker.CART_CONFIRMATION,
      data: {
        productItems,
      },
    };

    const message = JSON.stringify(payload);
    channel.publish(EXCHANGE_NAME, INVENTORY_SERVICE, Buffer.from(message), {
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

export const assertConfirmCart = async (productItems: ProductItem[]): Promise<void> => {
  const { message, result } = await requestConfirmCart(productItems);
  if (!result) {
    throw createError.Conflict(message);
  }
};
