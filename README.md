# bloggingapp-gcp-serveless
blogging app using google cloud platform
## TOOLS USED
- GOOGLE KUBERNETES ENGINE
- CLOUD KMS
- GCS-FUSE-CSI-DRIVER-GKE
- CLOUDSQL
## DESCRIPTION:
  THIS IS A SIMPLE DEMONSTRATION OF BLOGGING WEBSITE DEPLOYED IN GKE BACKED BY A CLOUDSQL BACKEND  TO STORE BLOG INFO
  AND CLOUD STORAGE TO STORE BLOG CONTENT AND 
  CLOUD KMS TO ENCRYPT IT
## STEPS TO DEPLOY:
   FIRST CLONE THIS REPO TO YOUR WORKSTATION
   ```bash
  git clone https://github.com/Gkemhcs/bloggingapp-gcp-gke.git
  cd bloggingapp-gcp-gke
   ```
  RUN THE STARTUP SCRIPT 
  ```bash
  chmod +x deploy.sh
  ./deploy.sh
  ```
