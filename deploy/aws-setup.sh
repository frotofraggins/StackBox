#!/bin/bash
set -e

AWS_REGION="us-west-2"
CLUSTER_NAME="stackpro-cluster"

echo "🏗️ Setting up AWS infrastructure for StackPro..."

# Create ECR repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
  --repository-name stackpro-api \
  --region $AWS_REGION || echo "Repository already exists"

# Create ECS cluster
echo "🏭 Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --region $AWS_REGION || echo "Cluster already exists"

# Create CloudWatch log group
echo "📊 Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name /ecs/stackpro-api \
  --region $AWS_REGION || echo "Log group already exists"

# Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
aws elbv2 create-load-balancer \
  --name stackpro-api-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345 \
  --region $AWS_REGION || echo "ALB already exists"

echo "✅ Infrastructure setup complete!"
echo "📋 Next steps:"
echo "1. Update security groups and subnets in the commands above"
echo "2. Create task definition: aws ecs register-task-definition --cli-input-json file://deploy/fargate-task-definition.json"
echo "3. Create ECS service with the task definition"
echo "4. Configure Route53 for api.stackpro.io"
