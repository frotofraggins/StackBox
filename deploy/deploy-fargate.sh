#!/bin/bash
set -e

# Configuration
AWS_ACCOUNT_ID="304052673868"
AWS_REGION="us-west-2"
ECR_REPOSITORY="stackpro-api"
CLUSTER_NAME="stackpro-cluster"
SERVICE_NAME="stackpro-api-service"

echo "🚀 Starting StackPro API deployment to Fargate..."

# Step 1: Build and push Docker image
echo "📦 Building Docker image..."
docker build -t $ECR_REPOSITORY:latest .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "🏷️ Tagging image..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "⬆️ Pushing to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Step 2: Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION

echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION

echo "✅ Deployment complete!"
echo "🌐 API URL: https://api.stackpro.io"
