module.exports = (expect, fs, dree, path) => {

    describe('Test: scan function', function () {

        let platform = null;
        switch (process.platform) {
            case 'win32':
                platform = 'windows';
                break;
            case 'linux':
                platform = 'linux';
                break;
            case 'darwin':
                platform = 'mac';
                break;
        }

        function parsePath(expected, normalize) {
            if(platform === 'windows') {
                if(normalize) {
                    expected = expected.replace(/PATH/g, process.cwd().replace(/\\/g, '/'));
                }
                else {
                    expected = expected.replace(/PATH/g, process.cwd().replace(/\\/g, '\\\\'));
                }
            } 
            else {
                expected = expected.replace(/PATH/g, process.cwd()).replace(/\\\\/g, '\\').replace(/\\/g, '/');
            }
            return expected;
        } 

        function getExpected(path, normalize) {
            let expected =  fs.readFileSync(path, 'utf8');
            expected = parsePath(expected, normalize);
            if (platform === 'windows') {
                const tree = JSON.parse(expected);
                delete tree.hash;
                expected = JSON.stringify(tree, null, 2);
            }
            return expected;
        }

        function getResult(tree) {
            if (platform === 'windows') {
                delete tree.hash;
            }
            return JSON.stringify(tree, null, 2);
        }

        it(`Should return the content of "test/scan/${platform}/first.test.json"`, function () {

            const result = getResult(dree.scan(path));
            const expected = getExpected(`test/scan/${platform}/first.test.json`);
            expect(result).to.equal(expected);

        });

        it(`Should return the content of "test/scan/${platform}/second.test.json"`, function () {

            const options = {
                extensions: ['', 'ts', 'json']
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/second.test.json`);
            expect(result).to.equal(expected);

        });

        it(`Should return the content of "test/scan/${platform}/third.test.json"`, function () {

            const options = {
                extensions: ['', 'ts', 'json'],
                symbolicLinks: false
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/third.test.json`);
            expect(result).to.equal(expected);

        });

        it(`Should return the content of "test/scan/${platform}/fourth.test.json"`, function () {

            const options = {
                stat: false,
                normalize: true,
                sizeInBytes: true,
                size: true,
                hash: true,
                hashAlgorithm: 'sha1',
                hashEncoding: 'base64',
                showHidden: false
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/fourth.test.json`, true);
            expect(result).to.equal(expected);

        });

        it(`Should return the content of "test/scan/${platform}/fifth.test.json" and compute folders and files sizes`, function () {

            const options = {
                depth: 2,
                exclude: /firebase/
            };

            let filesSize = 0, foldersSize = 0;
            const filesCallback = (_dirTree, stat) => {
                filesSize += stat.size;
            }
            const foldersCallback = (_dirTree, stat) => {
                foldersSize += stat.size;
            }

            const result = getResult(dree.scan(path, options, filesCallback, foldersCallback));
            const expected = getExpected(`test/scan/${platform}/fifth.test.json`);
            expect(result).to.equal(expected);
            switch (platform) {
                case 'windows':
                    expect(filesSize).to.equal(60);
                    expect(foldersSize).to.equal(0);
                    break;
                case 'linux':
                    expect(filesSize).to.equal(49);
                    expect(foldersSize).to.equal(24586);
                    break;
            }
        });

        it(`Should return the content of "test/scan/${platform}/sixth.test.json"`, function () {

            const options = {
                depth: -1
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/sixth.test.json`);

            expect(result).to.equal(expected);
        });

        it(`Should return the content of "test/scan/${platform}/seventh.test.json"`, function () {

            const options = {
                depth: 2,
                exclude: [/firebase/]
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/seventh.test.json`);

            expect(result).to.equal(expected);
        });

        it(`Should return the content of "test/scan/${platform}/eight.test.json"`, function () {

            const options = {
                emptyDirectory: true,
                excludeEmptyDirectories: true,
                exclude: /.ts/
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/eight.test.json`);

            expect(result).to.equal(expected);
        });

        it(`Should return the content of "test/scan/${platform}/ninth.test.json"`, function () {

            const options = {
                sizeInBytes: false,
                size: true
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/ninth.test.json`);

            expect(result).to.equal(expected);
        });

        it(`Should return the content of "test/scan/${platform}/tenth.test.json"`, function () {

            const options = {
                followLinks: true
            };

            const result = getResult(dree.scan(path, options));
            const expected = getExpected(`test/scan/${platform}/tenth.test.json`);

            expect(result).to.equal(expected);
        });

        it(`Should return null`, function () {

            const wrongPath = 'wrong';

            const result = dree.scan(wrongPath);
            const expected = null;

            expect(result).to.equal(expected);

        });

        it(`Should throw an error`, function () {

            const wrongPath = 'wrong';
            const options = {
                skipErrors: false
            }; 

            const willThrow = () => dree.scan(wrongPath, options);

            expect(willThrow).to.throw();

        });

    });

}