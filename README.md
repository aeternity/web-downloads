# Aeternity Downloads

## Development

```bash
npm run dev
```

## Deployment

After committing your changes to master:

```bash
git checkout -b gh-pages-build master
NODE_ENV=production npm run build
echo downloads.aeternity.io > .vuepress/dist/CNAME
git add -f .vuepress/dist
git commit -m "Deploy to GitHub pages"
git push origin `git subtree split --prefix .vuepress/dist gh-pages-build`:gh-pages --force
git checkout master && git branch -D gh-pages-build
```

### Build path

If the project is not deployed to a root path, it can be changed during the build:

```bash
BASE_PATH='/web-downloads/' npm run build
```
