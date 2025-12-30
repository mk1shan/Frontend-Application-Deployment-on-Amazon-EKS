# 🚀 Frontend Application Deployment on Amazon EKS

This project demonstrates how to deploy a **production-ready frontend application** on **Amazon EKS (Elastic Kubernetes Service)** using **AWS Fargate** and an **Application Load Balancer (ALB)**.

The focus of this project is **containerization, Kubernetes orchestration, IAM security, and AWS networking** — not backend development.

---

## 📊 Project Evidence

Since AWS resources incur cost, the cluster was deleted after verification.  
The following screenshots prove successful deployment and operation.

### 1️⃣ Live Application via AWS Load Balancer

This screenshot shows the frontend application running successfully on a **public AWS Application Load Balancer URL**, served through **NGINX** inside a Kubernetes pod.

![Frontend running on AWS ALB](images/live.png)

---

### 2️⃣ Kubernetes Infrastructure on EKS

This terminal output confirms:

- Pods running on **AWS Fargate**
- Kubernetes **Service** and **Ingress** configuration
- **ALB DNS** created dynamically by the AWS Load Balancer Controller

![kubectl output showing pods and ingress](images/terminal.png)

---

## 🛠️ Tech Stack

- **Cloud**: Amazon Web Services (AWS)
- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Compute**: AWS Fargate (Serverless)
- **Networking**: AWS Application Load Balancer (ALB)
- **Ingress Controller**: AWS Load Balancer Controller
- **Containers**: Docker (Multi-stage build)
- **Web Server**: NGINX
- **Frontend**: React / Astro

---

## 💡 Key Problems I Solved

### 🔐 IAM Security (IRSA)
Configured **IAM Roles for Service Accounts (IRSA)** to allow Kubernetes to create and manage ALBs **without using static AWS credentials**.

### 🚀 Production-Grade Frontend Build
Migrated from a development server to a **multi-stage Docker build with NGINX** for performance, security, and AWS compatibility.

### 🧩 ALB Controller Debugging
Resolved **AccessDenied** errors by updating IAM policy versions to allow proper **listener and load balancer attribute management**.

---

## 🏗️ Implementation Flow

1. Created an EKS cluster with **Fargate profiles** using `eksctl`
2. Built and pushed a **Dockerized frontend image**
3. Installed **AWS Load Balancer Controller** via Helm
4. Deployed Kubernetes **Deployment**, **Service**, and **Ingress** manifests
5. Verified public access through **ALB DNS**

---

#############################################
# Phase 1: Cluster & Infrastructure Setup
#############################################

# 1. Configure AWS CLI
aws configure

# 2. Create the MERN EKS Cluster on Fargate
eksctl create cluster --name mern-cluster --region us-east-1 --fargate

# 3. Update Kubeconfig to access the cluster
aws eks update-kubeconfig --name mern-cluster --region us-east-1

# 4. Create a dedicated namespace for the MERN application
kubectl create namespace mern-app


#############################################
# Phase 2: Fargate Profiles
#############################################

# 5. Create Fargate Profile for your MERN app namespace
eksctl create fargateprofile --cluster mern-cluster --name mern-app-profile --namespace mern-app


#############################################
# Phase 3: Identity & ALB Security
#############################################

# 6. Associate OIDC Provider
eksctl utils associate-iam-oidc-provider --cluster mern-cluster --approve

# 7. Setup IAM Policy for the ALB Controller
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name MERN-ALBController-Policy \
    --policy-document file://iam_policy.json

# 8. Create IAM Service Account (IRSA)
# Replace <MY_ACCOUNT_ID> with my actual AWS Account ID
eksctl create iamserviceaccount \
  --cluster=mern-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name MERN-ALB-Controller-Role \
  --attach-policy-arn=arn:aws:iam::<MY_ACCOUNT_ID>:policy/MERN-ALBController-Policy \
  --approve


#############################################
# Phase 4: Installing the ALB Controller
#############################################

# 9. Install Helm and add EKS charts
helm repo add eks https://aws.github.io/eks-charts
helm repo update eks

# 10. Install the Controller
# Get my VPC ID: aws eks describe-cluster --name mern-cluster --query "cluster.resourcesVpcConfig.vpcId" --output text
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=mern-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=<MY_VPC_ID>


#############################################
# Phase 5: Deploy REACT & Verification
#############################################

# 11. Deploy my REACT manifests
kubectl apply -f mern-deployment.yaml -n mern-app

# 12. Check status and get my public URL (ADDRESS)
kubectl get ingress -n mern-app


#############################################
# Cost Management
#############################################

# The cluster was deleted immediately after validation to avoid AWS charges
eksctl delete cluster --name mern-cluster


