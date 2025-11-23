#!/bin/bash
# Creates the todos table in DynamoDB Local with userId + id composite key

echo "Creating todos table in DynamoDB Local..."

aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name todos \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager

echo ""
echo "Table created successfully!"
echo ""
echo "To verify, run:"
echo "aws dynamodb list-tables --endpoint-url http://localhost:8000"
