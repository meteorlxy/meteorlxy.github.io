cd dist
echo www.meteorlxy.cn > CNAME
git init
git remote add origin https://github.com/meteorlxy/meteorlxy.github.io.git
git add .
git commit -m "update"
git push origin master --force
cd ..