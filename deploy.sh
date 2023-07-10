#! /bin/bash 
echo  "ENTER YOUR PROJECT ID"
read PROJECT_ID
echo "CONFIGURING THE PROJECT"
gcloud config set project $PROJECT_ID
gcloud services enable compute.googleapis.com  container.googleapis.com \
cloudkms.googleapis.com  artifactregistry.googleapis.com sqladmin.googleapis.com \
cloudbuild.googleapis.com servicenetworking.googleapis.com
BUCKET_NAME=$PROJECT_ID-blog
gsutil mb gs://$BUCKET_NAME
gcloud artifacts repositories create repo-blog --location us-central1 \
--repository-format docker --description "STORES THE  IMAGE ARTIFACTS OF FRONTEND BLOG WEBSITE"
gcloud iam service-accounts create blogger-gke 
gcloud kms keyrings create ring-us --location us 
gcloud kms keys create cryptoKey-us --location us --keyring ring-us --purpose encryption
gcloud beta compute addresses create sql-range --network default --global --prefix-length 16 \
 --purpose VPC_PEERING
gcloud services vpc-peerings connect --network servicenetworking.googleapis.com  --ranges sql-range \
--network default 
gcloud beta sql instances create sql-blog --network default --root-password gkem1234 \
--allocated-ip-range-name sql-range 
echo "WHEN PROMPTED FOR PASSWORD ENTER gkem1234  IN PROMPT"
gcloud sql connect sql-blog --user root < data-populate/blogging.sql 
gcloud beta  container clusters create cluster-1 --zone us-central1-a --machine-type e2-standard-2 \
--disk-type pd-standard --disk-size 100G --workload-pool $PROJECT_ID.svc.id.goog \
--addons GcsFuseCsiDriver --num-nodes 2
gcloud kms keys add-iam-policy-binding cryptoKey-us --location us --keyring ring-us \
 --member "serviceAccount:blogger-gke@${PROJECT_ID}.iam.gserviceaccount.com" \
 --role roles/cloudkms.cryptoKeyEncrypterDecrypter
gcloud iam service-accounts add-iam-policy-binding  blogger-gke@$PROJECT_ID.iam.gserviceaccount.com \
 --member "serviceAccount:${PROJECT_ID}.svc.id.goog[blogging/blogger]" \
 --role roles/iam.workloadIdentityUser
gcloud projects add-iam-policy-binding $PROJECT_ID \
--member "serviceAccount:blogger-gke@${PROJECT_ID}.iam.gserviceaccount.com" \
--role roles/storage.insightsCollectorService 
gcloud projects add-iam-policy-binding $PROJECT_ID \
--member "serviceAccount:blogger-gke@${PROJECT_ID}.iam.gserviceaccount.com" \
--role roles/storage.objectAdmin
cd app 
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-blog/blogging 
cd ../k8s-files
sed -i  "s/CLOUD_STORAGE_BUCKET/${BUCKET_NAME}/"  pv.yaml 
sed -i "s/GOOGLE_CLOUD_SERVICE_ACCOUNT/blogger-gke@${PROJECT_ID}.iam.gserviceaccount.com/" ns-sa-blogging.yaml 
sed -i "s/PROJECT_ID/${PROJECT_ID}/" deployment.yaml

CLOUD_SQL_INSTANCE_IP=$(gcloud sql instances describe sql-blog --format "value(ipAddresses[1].ipAddress)")
kubectl create secret generic sql-cred --from-literal=host=$CLOUD_SQL_INSTANCE_IP \
--from-literal=password=gkem1234 \
--from-literal=user=root \
--from-literal=database=blogging  \
--namespace  blogging
kubectl create configmap kms-info --from-literal=project=$PROJECT_ID \
 --from-literal=location=us \
 --from-literal=keyRing=ring-us \
 --from-literal=cryptoKey=cryptoKey-us \
 --namespace blogging
kubectl apply -f  na-sa-blogging.yaml 
kubectl apply -f pv.yaml 
kubectl apply -f pvc.yaml 
kubectl apply -f deployment.yaml

