import { Entity } from 'electrodb';
import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient();

export const TodoModel = new Entity(
  {
    model: { entity: 'todo', version: '1', service: 'main' },
    attributes: {
      namespace: { type: 'string', default: 'default' },
      id: { type: 'string', required: true },
      text: { type: 'string', required: true },
      completed: { type: 'boolean', required: true, default: false },
    },
    indexes: {
      todos: {
        pk: { field: 'pk', composite: ['namespace'], casing: 'none' },
        sk: { field: 'sk', composite: ['id'], casing: 'none' },
      },
    },
  },
  {
    client,
    table: Table.todosTable.tableName,
    logger: (event) => {
      console.log(JSON.stringify(event, null, 2));
    },
  },
);
