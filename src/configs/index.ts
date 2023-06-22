import { config } from 'dotenv';
config();

export const MONGO_DB_URL = process.env.MONGO_DB_URL!;

export const EVENT_STORE_DB_URL = process.env.EVENT_STORE_DB_URL!;

export const RABBIT_MQ_URL = process.env.RABBIT_MQ_URL!;
export const EXCHANGE_NAME = process.env.EXCHANGE_NAME!;
export const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE!;
