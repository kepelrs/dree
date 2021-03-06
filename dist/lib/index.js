"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var util_1 = require("util");
var BUFFER_SIZE = 8192;
var statAsync = util_1.promisify(fs_1.stat);
var readdirAsync = util_1.promisify(fs_1.readdir);
var readFileAsync = util_1.promisify(fs_1.readFile);
var lstatAsync = util_1.promisify(fs_1.lstat);
/* DREE TYPES */
/**
 * Enum whose values are DIRECTORY or FILE
 */
var Type;
(function (Type) {
    Type["DIRECTORY"] = "directory";
    Type["FILE"] = "file";
})(Type = exports.Type || (exports.Type = {}));
/* DEFAULT OPTIONS */
var SCAN_DEFAULT_OPTIONS = {
    stat: false,
    normalize: false,
    symbolicLinks: true,
    followLinks: false,
    sizeInBytes: true,
    size: true,
    hash: true,
    hashAlgorithm: "md5",
    hashEncoding: "hex",
    showHidden: true,
    depth: undefined,
    exclude: undefined,
    extensions: undefined,
    emptyDirectory: false,
    excludeEmptyDirectories: false,
    skipErrors: true,
};
var PARSE_DEFAULT_OPTIONS = {
    symbolicLinks: true,
    followLinks: false,
    showHidden: true,
    depth: undefined,
    exclude: undefined,
    extensions: undefined,
    skipErrors: true,
};
/* SUPPORT FUNCTIONS */
function mergeScanOptions(options) {
    var result = {};
    if (options) {
        for (var key in SCAN_DEFAULT_OPTIONS) {
            result[key] =
                options[key] !== undefined
                    ? options[key]
                    : SCAN_DEFAULT_OPTIONS[key];
        }
        if (result.depth < 0) {
            result.depth = 0;
        }
    }
    else {
        result = SCAN_DEFAULT_OPTIONS;
    }
    return result;
}
function mergeParseOptions(options) {
    var result = {};
    if (options) {
        for (var key in PARSE_DEFAULT_OPTIONS) {
            result[key] =
                options[key] !== undefined
                    ? options[key]
                    : PARSE_DEFAULT_OPTIONS[key];
        }
        if (result.depth < 0) {
            result.depth = 0;
        }
    }
    else {
        result = PARSE_DEFAULT_OPTIONS;
    }
    return result;
}
function parseSize(size) {
    var units = ["B", "KB", "MB", "GB", "TB"];
    var i;
    for (i = 0; i < units.length && size > 1000; i++) {
        size /= 1000;
    }
    return Math.round(size * 100) / 100 + " " + units[i];
}
function _scan(root, path, depth, options, onFile, onDir) {
    if (options.depth !== undefined && depth > options.depth) {
        return null;
    }
    if (options.exclude && root !== path) {
        var excludes = options.exclude instanceof RegExp
            ? [options.exclude]
            : options.exclude;
        if (excludes.some(function (pattern) { return pattern.test(path); })) {
            return null;
        }
    }
    var relativePath = root === path ? "." : path_1.relative(root, path);
    var name = path_1.basename(path);
    var stat;
    try {
        stat = fs_1.statSync(path);
    }
    catch (exception) {
        /* istanbul ignore next */
        if (options.skipErrors) {
            return null;
        }
        else {
            throw exception;
        }
    }
    var lstat;
    try {
        lstat = fs_1.lstatSync(path);
    }
    catch (exception) {
        /* istanbul ignore next */
        if (options.skipErrors) {
            return null;
        }
        else {
            throw exception;
        }
    }
    var symbolicLink = lstat.isSymbolicLink();
    var type = stat.isFile() ? Type.FILE : Type.DIRECTORY;
    if (!options.showHidden && name.charAt(0) === ".") {
        return null;
    }
    if (!options.symbolicLinks && symbolicLink) {
        return null;
    }
    var hash;
    if (options.hash) {
        var hashAlgorithm = options.hashAlgorithm;
        hash = crypto_1.createHash(hashAlgorithm);
        hash.update(name);
    }
    var dirTree = {
        name: name,
        path: options.normalize ? path.replace(/\\/g, "/") : path,
        relativePath: options.normalize
            ? relativePath.replace(/\\/g, "/")
            : relativePath,
        type: type,
        isSymbolicLink: symbolicLink,
        stat: options.stat ? (options.followLinks ? stat : lstat) : undefined,
    };
    switch (type) {
        case Type.DIRECTORY:
            var children_1 = [];
            var files = void 0;
            if (options.followLinks || !symbolicLink) {
                try {
                    files = fs_1.readdirSync(path);
                }
                catch (exception) {
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return null;
                    }
                    else {
                        throw exception;
                    }
                }
                if (options.emptyDirectory) {
                    dirTree.isEmpty = !files.length;
                }
                files.forEach(function (file) {
                    var child = _scan(root, path_1.resolve(path, file), depth + 1, options, onFile, onDir);
                    if (child !== null) {
                        children_1.push(child);
                    }
                });
                if (options.excludeEmptyDirectories && !children_1.length) {
                    return null;
                }
            }
            if (options.sizeInBytes || options.size) {
                var size = children_1.reduce(function (previous, current) {
                    return previous + current.sizeInBytes;
                }, 0);
                dirTree.sizeInBytes = size;
                dirTree.size = options.size ? parseSize(size) : undefined;
                if (!options.sizeInBytes) {
                    children_1.forEach(function (child) { return (child.sizeInBytes = undefined); });
                }
            }
            if (options.hash) {
                children_1.forEach(function (child) {
                    hash.update(child.hash);
                });
                var hashEncoding = options.hashEncoding;
                dirTree.hash = hash.digest(hashEncoding);
            }
            if (children_1.length) {
                dirTree.children = children_1;
            }
            break;
        case Type.FILE:
            dirTree.extension = path_1.extname(path).replace(".", "");
            if (options.extensions &&
                options.extensions.indexOf(dirTree.extension) === -1) {
                return null;
            }
            if (options.sizeInBytes || options.size) {
                var size = options.followLinks ? stat.size : lstat.size;
                dirTree.sizeInBytes = size;
                dirTree.size = options.size ? parseSize(size) : undefined;
            }
            if (options.hash) {
                var data = Buffer.alloc(BUFFER_SIZE);
                var fd = void 0;
                try {
                    fd = fs_1.openSync(path, "r");
                    var bytesRead = void 0;
                    do {
                        bytesRead = fs_1.readSync(fd, data, 0, BUFFER_SIZE, null);
                        hash.update(data.slice(0, bytesRead));
                    } while (bytesRead === BUFFER_SIZE);
                    data = fs_1.readFileSync(path);
                }
                catch (exception) {
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return null;
                    }
                    else {
                        throw exception;
                    }
                }
                finally {
                    fs_1.closeSync(fd);
                }
                var hashEncoding = options.hashEncoding;
                dirTree.hash = hash.digest(hashEncoding);
            }
            break;
        default:
            /* istanbul ignore next */
            return null;
    }
    if (onFile && type === Type.FILE) {
        onFile(dirTree, options.followLinks ? stat : lstat);
    }
    else if (onDir && type === Type.DIRECTORY) {
        onDir(dirTree, options.followLinks ? stat : lstat);
    }
    return dirTree;
}
function _scanAsync(root, path, depth, options, onFile, onDir) {
    return __awaiter(this, void 0, void 0, function () {
        var excludes, relativePath, name, stat, exception_1, lstat, exception_2, symbolicLink, type, hash, hashAlgorithm, dirTree, _a, children_2, files, exception_3, size, hashEncoding, size, size, fileIsLarge, data, exception_4, hashEncoding;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (options.depth !== undefined && depth > options.depth) {
                        return [2 /*return*/, null];
                    }
                    if (options.exclude && root !== path) {
                        excludes = options.exclude instanceof RegExp
                            ? [options.exclude]
                            : options.exclude;
                        if (excludes.some(function (pattern) { return pattern.test(path); })) {
                            return [2 /*return*/, null];
                        }
                    }
                    relativePath = root === path ? "." : path_1.relative(root, path);
                    name = path_1.basename(path);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, statAsync(path)];
                case 2:
                    stat = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    exception_1 = _b.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_1;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, lstatAsync(path)];
                case 5:
                    lstat = _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    exception_2 = _b.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_2;
                    }
                    return [3 /*break*/, 7];
                case 7:
                    symbolicLink = lstat.isSymbolicLink();
                    type = stat.isFile() ? Type.FILE : Type.DIRECTORY;
                    if (!options.showHidden && name.charAt(0) === ".") {
                        return [2 /*return*/, null];
                    }
                    if (!options.symbolicLinks && symbolicLink) {
                        return [2 /*return*/, null];
                    }
                    if (options.hash) {
                        hashAlgorithm = options.hashAlgorithm;
                        hash = crypto_1.createHash(hashAlgorithm);
                        hash.update(name);
                    }
                    dirTree = {
                        name: name,
                        path: options.normalize ? path.replace(/\\/g, "/") : path,
                        relativePath: options.normalize
                            ? relativePath.replace(/\\/g, "/")
                            : relativePath,
                        type: type,
                        isSymbolicLink: symbolicLink,
                        stat: options.stat ? (options.followLinks ? stat : lstat) : undefined,
                    };
                    _a = type;
                    switch (_a) {
                        case Type.DIRECTORY: return [3 /*break*/, 8];
                        case Type.FILE: return [3 /*break*/, 15];
                    }
                    return [3 /*break*/, 24];
                case 8:
                    children_2 = [];
                    files = void 0;
                    if (!(options.followLinks || !symbolicLink)) return [3 /*break*/, 14];
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, readdirAsync(path)];
                case 10:
                    files = _b.sent();
                    return [3 /*break*/, 12];
                case 11:
                    exception_3 = _b.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_3;
                    }
                    return [3 /*break*/, 12];
                case 12:
                    if (options.emptyDirectory) {
                        dirTree.isEmpty = !files.length;
                    }
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var child;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, _scanAsync(root, path_1.resolve(path, file), depth + 1, options, onFile, onDir)];
                                    case 1:
                                        child = _a.sent();
                                        if (child !== null) {
                                            children_2.push(child);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 13:
                    _b.sent();
                    if (options.excludeEmptyDirectories && !children_2.length) {
                        return [2 /*return*/, null];
                    }
                    _b.label = 14;
                case 14:
                    if (options.sizeInBytes || options.size) {
                        size = children_2.reduce(function (previous, current) {
                            return previous + current.sizeInBytes;
                        }, 0);
                        dirTree.sizeInBytes = size;
                        dirTree.size = options.size ? parseSize(size) : undefined;
                        if (!options.sizeInBytes) {
                            children_2.forEach(function (child) { return (child.sizeInBytes = undefined); });
                        }
                    }
                    if (options.hash) {
                        children_2.forEach(function (child) {
                            hash.update(child.hash);
                        });
                        hashEncoding = options.hashEncoding;
                        dirTree.hash = hash.digest(hashEncoding);
                    }
                    if (children_2.length) {
                        dirTree.children = children_2;
                    }
                    return [3 /*break*/, 25];
                case 15:
                    dirTree.extension = path_1.extname(path).replace(".", "");
                    if (options.extensions &&
                        options.extensions.indexOf(dirTree.extension) === -1) {
                        return [2 /*return*/, null];
                    }
                    if (options.sizeInBytes || options.size) {
                        size = options.followLinks ? stat.size : lstat.size;
                        dirTree.sizeInBytes = size;
                        dirTree.size = options.size ? parseSize(size) : undefined;
                    }
                    if (!options.hash) return [3 /*break*/, 23];
                    size = (lstat === null || lstat === void 0 ? void 0 : lstat.size) || (stat === null || stat === void 0 ? void 0 : stat.size);
                    fileIsLarge = size > 2147483647;
                    data = void 0;
                    _b.label = 16;
                case 16:
                    _b.trys.push([16, 21, , 22]);
                    if (!fileIsLarge) return [3 /*break*/, 18];
                    return [4 /*yield*/, hashLargeFileAsync(path, hash, dirTree, options)];
                case 17:
                    _b.sent();
                    return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, readFileAsync(path)];
                case 19:
                    data = _b.sent();
                    _b.label = 20;
                case 20: return [3 /*break*/, 22];
                case 21:
                    exception_4 = _b.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_4;
                    }
                    return [3 /*break*/, 22];
                case 22:
                    if (!fileIsLarge) {
                        hash.update(data);
                        hashEncoding = options.hashEncoding;
                        dirTree.hash = hash.digest(hashEncoding);
                    }
                    _b.label = 23;
                case 23: return [3 /*break*/, 25];
                case 24: 
                /* istanbul ignore next */
                return [2 /*return*/, null];
                case 25:
                    if (onFile && type === Type.FILE) {
                        onFile(dirTree, options.followLinks ? stat : lstat);
                    }
                    else if (onDir && type === Type.DIRECTORY) {
                        onDir(dirTree, options.followLinks ? stat : lstat);
                    }
                    return [2 /*return*/, dirTree];
            }
        });
    });
}
function skip(child, options, depth) {
    return ((!options.symbolicLinks && child.isSymbolicLink) ||
        (!options.showHidden && child.name.charAt(0) === ".") ||
        (options.extensions !== undefined &&
            child.type === Type.FILE &&
            options.extensions.indexOf(child.extension) === -1) ||
        (options.exclude instanceof RegExp &&
            options.exclude.test(child.path)) ||
        (Array.isArray(options.exclude) &&
            options.exclude.some(function (pattern) { return pattern.test(child.path); })) ||
        (options.depth !== undefined && depth > options.depth));
}
function _parse(children, prefix, options, depth) {
    var result = "";
    var lines = children.map(function (child, index) {
        var result = "";
        if (options.depth !== undefined && depth > options.depth) {
            return "";
        }
        if (options.exclude) {
            var excludes = options.exclude instanceof RegExp
                ? [options.exclude]
                : options.exclude;
            if (excludes.some(function (pattern) { return pattern.test(child); })) {
                return "";
            }
        }
        var name = path_1.basename(child);
        var stat;
        try {
            stat = fs_1.statSync(child);
        }
        catch (exception) {
            /* istanbul ignore next */
            if (options.skipErrors) {
                return null;
            }
            else {
                throw exception;
            }
        }
        var lstat;
        try {
            lstat = fs_1.lstatSync(child);
        }
        catch (exception) {
            /* istanbul ignore next */
            if (options.skipErrors) {
                return null;
            }
            else {
                throw exception;
            }
        }
        var symbolicLink = lstat.isSymbolicLink();
        var type = stat.isFile() ? Type.FILE : Type.DIRECTORY;
        if (!options.showHidden && name.charAt(0) === ".") {
            return "";
        }
        if (!options.symbolicLinks && symbolicLink) {
            return "";
        }
        var extension = path_1.extname(child).replace(".", "");
        if (options.extensions &&
            type === Type.FILE &&
            options.extensions.indexOf(extension) === -1) {
            return "";
        }
        var last = symbolicLink
            ? ">>"
            : type === Type.DIRECTORY
                ? "─> "
                : "── ";
        var newPrefix = prefix + (index === children.length - 1 ? "    " : "│   ");
        result += last + name;
        if ((options.followLinks || !symbolicLink) && type === Type.DIRECTORY) {
            var children_3;
            try {
                children_3 = fs_1.readdirSync(child).map(function (file) {
                    return path_1.resolve(child, file);
                });
            }
            catch (exception) {
                /* istanbul ignore next */
                if (options.skipErrors) {
                    return null;
                }
                else {
                    throw exception;
                }
            }
            result += children_3.length
                ? _parse(children_3, newPrefix, options, depth + 1)
                : "";
        }
        return result;
    });
    lines
        .filter(function (line) { return !!line; })
        .forEach(function (line, index, lines) {
        result +=
            prefix + (index === lines.length - 1 ? "└" + line : "├" + line);
    });
    return result;
}
function _parseAsync(children, prefix, options, depth) {
    return __awaiter(this, void 0, void 0, function () {
        var result, lines;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = "";
                    return [4 /*yield*/, Promise.all(children.map(function (child, index) { return __awaiter(_this, void 0, void 0, function () {
                            var result, excludes, name, stat, exception_5, lstat, exception_6, symbolicLink, type, extension, last, newPrefix, children_4, exception_7, _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        result = "";
                                        if (options.depth !== undefined && depth > options.depth) {
                                            return [2 /*return*/, ""];
                                        }
                                        if (options.exclude) {
                                            excludes = options.exclude instanceof RegExp
                                                ? [options.exclude]
                                                : options.exclude;
                                            if (excludes.some(function (pattern) { return pattern.test(child); })) {
                                                return [2 /*return*/, ""];
                                            }
                                        }
                                        name = path_1.basename(child);
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, statAsync(child)];
                                    case 2:
                                        stat = _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        exception_5 = _c.sent();
                                        /* istanbul ignore next */
                                        if (options.skipErrors) {
                                            return [2 /*return*/, null];
                                        }
                                        else {
                                            throw exception_5;
                                        }
                                        return [3 /*break*/, 4];
                                    case 4:
                                        _c.trys.push([4, 6, , 7]);
                                        return [4 /*yield*/, lstatAsync(child)];
                                    case 5:
                                        lstat = _c.sent();
                                        return [3 /*break*/, 7];
                                    case 6:
                                        exception_6 = _c.sent();
                                        /* istanbul ignore next */
                                        if (options.skipErrors) {
                                            return [2 /*return*/, null];
                                        }
                                        else {
                                            throw exception_6;
                                        }
                                        return [3 /*break*/, 7];
                                    case 7:
                                        symbolicLink = lstat.isSymbolicLink();
                                        type = stat.isFile() ? Type.FILE : Type.DIRECTORY;
                                        if (!options.showHidden && name.charAt(0) === ".") {
                                            return [2 /*return*/, ""];
                                        }
                                        if (!options.symbolicLinks && symbolicLink) {
                                            return [2 /*return*/, ""];
                                        }
                                        extension = path_1.extname(child).replace(".", "");
                                        if (options.extensions &&
                                            type === Type.FILE &&
                                            options.extensions.indexOf(extension) === -1) {
                                            return [2 /*return*/, ""];
                                        }
                                        last = symbolicLink
                                            ? ">>"
                                            : type === Type.DIRECTORY
                                                ? "─> "
                                                : "── ";
                                        newPrefix = prefix + (index === children.length - 1 ? "    " : "│   ");
                                        result += last + name;
                                        if (!((options.followLinks || !symbolicLink) &&
                                            type === Type.DIRECTORY)) return [3 /*break*/, 15];
                                        _c.label = 8;
                                    case 8:
                                        _c.trys.push([8, 10, , 11]);
                                        return [4 /*yield*/, readdirAsync(child)];
                                    case 9:
                                        children_4 = (_c.sent()).map(function (file) {
                                            return path_1.resolve(child, file);
                                        });
                                        return [3 /*break*/, 11];
                                    case 10:
                                        exception_7 = _c.sent();
                                        /* istanbul ignore next */
                                        if (options.skipErrors) {
                                            return [2 /*return*/, null];
                                        }
                                        else {
                                            throw exception_7;
                                        }
                                        return [3 /*break*/, 11];
                                    case 11:
                                        _a = result;
                                        if (!children_4.length) return [3 /*break*/, 13];
                                        return [4 /*yield*/, _parseAsync(children_4, newPrefix, options, depth + 1)];
                                    case 12:
                                        _b = _c.sent();
                                        return [3 /*break*/, 14];
                                    case 13:
                                        _b = "";
                                        _c.label = 14;
                                    case 14:
                                        result = _a + _b;
                                        _c.label = 15;
                                    case 15: return [2 /*return*/, result];
                                }
                            });
                        }); }))];
                case 1:
                    lines = _a.sent();
                    lines
                        .filter(function (line) { return !!line; })
                        .forEach(function (line, index, lines) {
                        result +=
                            prefix + (index === lines.length - 1 ? "└" + line : "├" + line);
                    });
                    return [2 /*return*/, result];
            }
        });
    });
}
function _parseTree(children, prefix, options, depth) {
    var result = "";
    children
        .filter(function (child) { return !skip(child, options, depth); })
        .forEach(function (child, index, children) {
        var last = child.isSymbolicLink
            ? ">>"
            : child.type === Type.DIRECTORY
                ? "─> "
                : "── ";
        var line = index === children.length - 1 ? "└" + last : "├" + last;
        var newPrefix = prefix + (index === children.length - 1 ? "    " : "│   ");
        result += prefix + line + child.name;
        result +=
            child.children && (options.followLinks || !child.isSymbolicLink)
                ? _parseTree(child.children, newPrefix, options, depth + 1)
                : "";
    });
    return result;
}
function _parseTreeAsync(children, prefix, options, depth) {
    return __awaiter(this, void 0, void 0, function () {
        var result, filteredChildren, index, child, last, line, newPrefix, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    result = "";
                    filteredChildren = children.filter(function (child) { return !skip(child, options, depth); });
                    index = 0;
                    _c.label = 1;
                case 1:
                    if (!(index < filteredChildren.length)) return [3 /*break*/, 6];
                    child = filteredChildren[index];
                    last = child.isSymbolicLink
                        ? ">>"
                        : child.type === Type.DIRECTORY
                            ? "─> "
                            : "── ";
                    line = index === filteredChildren.length - 1 ? "└" + last : "├" + last;
                    newPrefix = prefix + (index === filteredChildren.length - 1 ? "    " : "│   ");
                    result += prefix + line + child.name;
                    _a = result;
                    if (!(child.children && (options.followLinks || !child.isSymbolicLink))) return [3 /*break*/, 3];
                    return [4 /*yield*/, _parseTreeAsync(child.children, newPrefix, options, depth + 1)];
                case 2:
                    _b = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _b = "";
                    _c.label = 4;
                case 4:
                    result = _a + _b;
                    _c.label = 5;
                case 5:
                    index++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, result];
            }
        });
    });
}
/* EXPORTED FUNCTIONS */
/**
 * Returns the Directory Tree of a given path. This function in synchronous.
 * @param  {string} path The path which you want to inspect
 * @param  {object} options An object used as options of the function
 * @param  {function} onFile A function called when a file is added - has the tree object and its stat as parameters
 * @param  {function} onDir A function called when a dir is added - has the tree object and its stat as parameters
 * @return {object} The directory tree as a Dree object
 */
function scan(path, options, onFile, onDir) {
    var root = path_1.resolve(path);
    var opt = mergeScanOptions(options);
    var result = _scan(root, root, 0, opt, onFile, onDir);
    if (result) {
        result.sizeInBytes = opt.sizeInBytes ? result.sizeInBytes : undefined;
    }
    return result;
}
exports.scan = scan;
/**
 * Returns in a promise the Directory Tree of a given path. This function is asynchronous.
 * @param  {string} path The path which you want to inspect
 * @param  {object} options An object used as options of the function
 * @param  {function} onFile A function called when a file is added - has the tree object and its stat as parameters
 * @param  {function} onDir A function called when a dir is added - has the tree object and its stat as parameters
 * @return {Promise<object>} A promise to the directory tree as a Dree object
 */
function scanAsync(path, options, onFile, onDir) {
    return __awaiter(this, void 0, void 0, function () {
        var root, opt, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    root = path_1.resolve(path);
                    opt = mergeScanOptions(options);
                    return [4 /*yield*/, _scanAsync(root, root, 0, opt, onFile, onDir)];
                case 1:
                    result = (_a.sent());
                    if (result) {
                        result.sizeInBytes = opt.sizeInBytes ? result.sizeInBytes : undefined;
                    }
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.scanAsync = scanAsync;
/**
 * Returns a string representation of a Directory Tree given a path to a directory or file
 * @param  {string} dirTree The path which you want to inspect
 * @param  {object} options An object used as options of the function
 * @return {string} A string representing the Directory Tree of the given path
 */
function parse(path, options) {
    var result = "";
    var root = path_1.resolve(path);
    var opt = mergeParseOptions(options);
    var name = path_1.basename(root);
    result += name;
    var stat;
    try {
        stat = fs_1.statSync(path);
    }
    catch (exception) {
        /* istanbul ignore next */
        if (options.skipErrors) {
            return null;
        }
        else {
            throw exception;
        }
    }
    var lstat;
    try {
        lstat = fs_1.lstatSync(path);
    }
    catch (exception) {
        /* istanbul ignore next */
        if (options.skipErrors) {
            return null;
        }
        else {
            throw exception;
        }
    }
    var symbolicLink = lstat.isSymbolicLink();
    if ((opt.followLinks || !symbolicLink) && stat.isDirectory()) {
        var children = void 0;
        try {
            children = fs_1.readdirSync(root).map(function (file) { return path_1.resolve(root, file); });
        }
        catch (exception) {
            /* istanbul ignore next */
            if (options.skipErrors) {
                return null;
            }
            else {
                throw exception;
            }
        }
        result += children.length ? _parse(children, "\n ", opt, 1) : "";
    }
    return result;
}
exports.parse = parse;
/**
 * Returns a promise to a string representation of a Directory Tree given a path to a directory or file
 * @param  {string} dirTree The path which you want to inspect
 * @param  {object} options An object used as options of the function
 * @return {Promise<string}> A promise to a string representing the Directory Tree of the given path
 */
function parseAsync(path, options) {
    return __awaiter(this, void 0, void 0, function () {
        var result, root, opt, name, stat, exception_8, lstat, exception_9, symbolicLink, children, exception_10, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    result = "";
                    root = path_1.resolve(path);
                    opt = mergeParseOptions(options);
                    name = path_1.basename(root);
                    result += name;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, statAsync(path)];
                case 2:
                    stat = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    exception_8 = _c.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_8;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, lstatAsync(path)];
                case 5:
                    lstat = _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    exception_9 = _c.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_9;
                    }
                    return [3 /*break*/, 7];
                case 7:
                    symbolicLink = lstat.isSymbolicLink();
                    if (!((opt.followLinks || !symbolicLink) && stat.isDirectory())) return [3 /*break*/, 15];
                    children = void 0;
                    _c.label = 8;
                case 8:
                    _c.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, readdirAsync(root)];
                case 9:
                    children = (_c.sent()).map(function (file) {
                        return path_1.resolve(root, file);
                    });
                    return [3 /*break*/, 11];
                case 10:
                    exception_10 = _c.sent();
                    /* istanbul ignore next */
                    if (options.skipErrors) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw exception_10;
                    }
                    return [3 /*break*/, 11];
                case 11:
                    _a = result;
                    if (!children.length) return [3 /*break*/, 13];
                    return [4 /*yield*/, _parseAsync(children, "\n ", opt, 1)];
                case 12:
                    _b = _c.sent();
                    return [3 /*break*/, 14];
                case 13:
                    _b = "";
                    _c.label = 14;
                case 14:
                    result = _a + _b;
                    _c.label = 15;
                case 15: return [2 /*return*/, result];
            }
        });
    });
}
exports.parseAsync = parseAsync;
/**
 * Returns a string representation of a Directory Tree given an object returned from scan
 * @param  {object} dirTree The object returned from scan, which will be parsed
 * @param  {object} options An object used as options of the function
 * @return {string} A string representing the object given as first parameter
 */
function parseTree(dirTree, options) {
    var result = "";
    var opt = mergeParseOptions(options);
    result += dirTree ? dirTree.name : "";
    result += dirTree.children
        ? _parseTree(dirTree.children, "\n ", opt, 1)
        : "";
    return result;
}
exports.parseTree = parseTree;
/**
 * Returns a promise to a string representation of a Directory Tree given an object returned from scan
 * @param  {object} dirTree The object returned from scan, which will be parsed
 * @param  {object} options An object used as options of the function
 * @return {Promise<string>} A promise to a string representing the object given as first parameter
 */
function parseTreeAsync(dirTree, options) {
    return __awaiter(this, void 0, void 0, function () {
        var result, opt, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    result = "";
                    opt = mergeParseOptions(options);
                    result += dirTree ? dirTree.name : "";
                    _a = result;
                    if (!dirTree.children) return [3 /*break*/, 2];
                    return [4 /*yield*/, _parseTreeAsync(dirTree.children, "\n ", opt, 1)];
                case 1:
                    _b = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _b = "";
                    _c.label = 3;
                case 3:
                    result = _a + _b;
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.parseTreeAsync = parseTreeAsync;
function hashLargeFileAsync(path, hash, dirTree, options) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = fs_1.createReadStream(path);
                    data.on("error", function (err) {
                        throw err;
                    });
                    data.pipe(hash);
                    return [4 /*yield*/, new Promise(function (res, rej) {
                            hash.once("readable", function () {
                                dirTree.hash = hash.digest(options.hashEncoding);
                                res();
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.hashLargeFileAsync = hashLargeFileAsync;
//# sourceMappingURL=index.js.map