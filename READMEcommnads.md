# How to setup project

DPhase 1: Cluster & Infrastructure Setup

Configure AWS CLI
```
aws configure
```

Create the MERN EKS Cluster on Fargate

```
eksctl create cluster --name mern-cluster --region us-east-1 --fargate
```

Update Kubeconfig to access the cluster

```
aws eks update-kubeconfig --name mern-cluster --region us-east-1
```

## Phase 2: Fargate Profiles

Create Fargate Profile for your MERN app namespace

```
eksctl create fargateprofile --cluster mern-cluster --name mern-app-profile --namespace mern-app
```

## Phase 3: Identity & ALB Security
## Associate OIDC Provider

```
curl -O [https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json](https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json)

aws iam create-policy \
    --policy-name MERN-ALBController-Policy \
    --policy-document file://iam_policy.json
```

Setup IAM Policy for the ALB Controller

```
helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system \
  --set clusterName=<your-cluster-name> \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=<your-region> \
  --set vpcId=<your-vpc-id>
```

Create IAM Service Account (IRSA)

```
eksctl create iamserviceaccount \
  --cluster=mern-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name MERN-ALB-Controller-Role \
  --attach-policy-arn=arn:aws:iam::<MY_ACCOUNT_ID>:policy/MERN-ALBController-Policy \
  --approve
```

## Phase 4: Installing the ALB Controller
Add EKS charts

```
helm repo add eks [https://aws.github.io/eks-charts](https://aws.github.io/eks-charts)
helm repo update eks
```

Install the Controller

```
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=mern-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=<MY_VPC_ID>
```
## Phase 5: Deploy REACT & Verification
Deploy my REACT manifests

```
kubectl apply -f astro-deploy.yaml
```

Check status and get my public URL (ADDRESS)

```
# Check the status of your 5 replicas
kubectl get pods -n astro-mern-ns

# Get the Public URL (under the ADDRESS column)
kubectl get ingress -n astro-mern-ns
```
