# rofolio

https://github.com/j26o/rofolio

Developer portfolio site of Ro Baldovino

## Building and running on localhost

Install dependencies:

```sh
npm install
```

To run in hot module reloading mode:

```sh
npm start
```

To create a production build:

```sh
npm run build-prod
```

## Running

```sh
node dist/bundle.js
```

## Project Structure

```
dist - Directory for built and compressed files from the npm build script
src - Directory for all dev files
├── sass - Contains all SCSS files, that are compiled to `dist/css`
├── js - All the Three.js app files, with `app.js` as entry point. Compiled to `dist/js` with parcel
│   └── gl - Three.js components that get initialized in `app.js`
└── fonts - where fonts are located
└── img - all images and textures
```

## Credits

Made with [createapp.dev](https://createapp.dev/)
