./scripts/get_local_ip.sh

node ./nodejs-microsrvcs/ui-frontend/app.js &
node ./nodejs-microsrvcs/image-management/app.js &
node ./nodejs-microsrvcs/video-management/app.js &
node ./nodejs-microsrvcs/model-management/app.js &
