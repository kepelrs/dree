# dree
A nodejs module wich helps you handle a directory tree. It provides you an object of a directory tree with custom configuration and optional callback method when a file or dir is scanned. With Typescript support.

## Install

```bash
$ npm install dree
```

## Usage

Simple:

```js
const dree = require('dree');
const tree = dree.scan('./folder');
```

With custom configuration:

```js
const dree = require('dree');

const options = {
  stat: false,
  normalize: true,
  followLinks: true,
  size: true,
  hash: true,
  depth: 5,
  exclude: /nofetchdir/g,
  extensions: [ 'txt', 'jpg' ]
};

const tree = dree.scan('./folder', options);
```

With file and dir callbacks:

```js
const dree = require('dree');

const options = {
  stat: false
};

const fileCallback = function (element, stat) {
  console.log('Found file named ' + element.name + ' created on ' + stat.ctime);
};
const dirCallback = function (element, stat) {
  console.log('Found file named ' + element.name + ' created on ' + stat.ctime);
};

const tree = dree.scan('./folder', options, fileCallback, dirCallback);
```

## Result

Given a directory structured like this:

```
sample
├── backend
│   └── firebase.json
│   └── server
│       └── server.ts
└── frontend
│    └── angular
│       ├── app.ts
│       └── index.html
└── .gitignore
```
With this configurations:

```js
const options = {
    stat: false,
    hash: false,
    sizeInBytes: false,
    size: true,
    normalize: true,
    extensions: [ 'ts', 'json' ]
};
```

The result will be:

```json
{
  "name": "sample",
  "path": "D:/Github/dree/test/sample",
  "relativePath": ".",
  "type": "directory",
  "isSymbolicLink": false,
  "size": "1.79 MB",
  "children": [
    {
      "name": "backend",
      "path": "D:/Github/dree/test/sample/backend",
      "relativePath": "backend",
      "type": "directory",
      "isSymbolicLink": false,
      "size": "1.79 MB",
      "children": [
        {
          "name": "firebase.json",
          "path": "D:/Github/dree/test/sample/backend/firebase.json",
          "relativePath": "backend/firebase.json",
          "type": "file",
          "isSymbolicLink": false,
          "extension": "json",
          "size": "29 B"
        }, 
        {
          "name": "server",
          "path": "D:/Github/dree/test/sample/backend/server",
          "relativePath": "backend/server",
          "type": "directory",
          "isSymbolicLink": false,
          "size": "1.79 MB",
          "children": [
            {
              "name": "server.ts",
              "path": "D:/Github/dree/test/sample/backend/server/server.ts",
              "relativePath": "backend/server/server.ts",
              "type": "file",
              "isSymbolicLink": false,
              "extension": "ts",
              "size": "1.79 MB"
            }
          ]
        }
      ]
    }
  ]
}
```
## API

### scan

**Syntax:**

`dree.scan(path, options, fileCallback, dirCallback)`

**Description:**

Given a path, returns an object representing its directory tree. The result could be customized with options and a callback for either each file and each directory is provided. Executed syncronously. See __Usage__ to have an example.

**Parameters:**

* `path`: Is of type `string`, and is the relative or absolute path the file or directory that you want to scan
* `options`: Optional. Is of type `object` and allows you to have customize the function behaviour.
* `fileCallback`: Optional. Called each time a file is added to the tree. It provides you the node, wich **reflects** the fiven options, and its status returned by fs.stat (fs.lstat if `followLinks` option is enabled).
* `dirCallback`: Optional. Called each time a directory is added to the tree. It provides you the node, wich **reflects** the fiven options, and its status returned by fs.lstat (fs.stat if `followLinks` option is enabled).

**Options parameters:**

* `stat`: Default value: `false`. If true every node of the result will contain `stat` property, provided by `fs.lstat` or `fs.stat`.
* `normalize`: Default value: `false`. If true, on windows, normalize each path replacing each backslash `\\` with a slash `/`.
* `symbolicLinks`: Default value: `true`. If true, all symbolic links found will be included in the result. Could not work on Windows.
* `followLinks`: Default value: `false`. If true, all symbolic links will be followed, including even their content if they link to a folder. Could not work on Windows.
* `sizeInBytes`: Default value: `true`. If true, every node in the result will contain `sizeInBytes` property as the number of bytes of the content. If a node is a folder, only its considered inner files will be computed to have this size.
* `size`: Default value: `true`. If true, every node in the result will contain `size` property. Same as `sizeInBytes`, but it is a string rounded to the second decimal digit and with an appropriate unit.
* `hash`: Default value: `true`. If true, every node in the result will contain `hash` property, computed by taking in consideration the name and the content of the node. If the node is a folder, all his considered inner files will be used by the algorithm.
* `hashAlgorithm`: Values: `md5`(default) and `sha1`. Hash algorithm used by `cryptojs` to return the hash.
* `hashEncoding`: Values: `hex`(default), `latin1` and `base64`. Hash encoding used by `cryptojs` to return the hash.
* `showHidden`: Default value: `true`. If true, all hidden files and dirs will be included in the result. A hidden file or a directory has a name wich starts with a dot and in some systems like Linux are hidden.
* `depth`: Default value: `undefined`. It is a number wich says the max depth the algorithm can reach scanning the given path. All files and dirs wich are beyound the max depth will not be considered by the algorithm.
* `exclude`: Default value: `undefined`. It is a regex or array of regex and all the matched paths will not be considered by the algorithm.
* `extensions`: Default value: `undefined`. It is an array of strings and all the files whose extension is not included in that array will be skipped by the algorithm. If value is `undefined`, all file extensions will be considered, if it is `[]`, no files will be included.

**Result object parameters:**

* `name`: Always returned. The name of the node as a string.
* `path`: Always returned. The absolute path of the node.
* `relativePath`: Always returned. The relative path from the root of the node.
* `type`: Always returned. Values: `file` or `directory`.
* `isSymbolicLink`: Always returned. A boolean with true value if the node is a symbolic link.
* `sizeInBytes`: The size in bytes of the node, returned as a number.
* `size`: The size of the node, returned as a string rounded to two decimals and appropriate unit.
* `hash`: The hash of the node.
* `extension`: The extension (without dot) of the node. Returned only if the node is a file.
* `stat`: The `fs.lstat` or `fs.fstat` of the node.
* `children`: An array of object structured like this one, containing all the children of the node.

This is also the structure of the callbacks first parameter.

## Note

On **Windows** it could be possible that symbolic links are not detected, due to a problem with node fs module. If `symbolicLinks` is set to true, then `isSymbolicLink` could result `false` for al the tree nodes. In addition, if `followLinks` is set to true, it could be possible that links will not be followed instead.

The **callbacks** have a tree representation of the node and its stat as parameters. The tree parameter **reflects** the options given to `scan`. For example, if you set `hash` to `false`, then the tree parameter of a callback will not have the hash value. The stat parameter **depends** on the `followLinks` option. If it is true it will be the result of `fs.stat`, otherwise it will be the result of `fs.lstat`.

Properties as **hash** or **size** are computed considering only the **not filtered** nodes. For instance, the result size of a folder could be different from its actual size, if some of its inner files have not been considered due to filters as `exclude`.

The **hash** of two nodes with the same content could be **different**, because also the **name** is take in consideration.

## Dev

To run tests go to the package root in your CLI and run

```bash
$ npm test
```
Make sure you have the dev dependencies installed.
