// REF: https://github.com/jimmywarting/FormData/blob/master/test/test-polyfill.html
describe('FormData', () => {
    let FormData, Blob, File;
    beforeEach(async () => {
        !FormData && (FormData = (await require('./index')).FormData);
        !Blob && (Blob = (await require('../Blob')).Blob);
        !File && (File = (await require('../File')).File);
    });

    function fromIterator(it) {
        const arr = [];
        let result = it.next();
        while (!result.done) {
            arr.push(result.value);
            result = it.next();
        }
        return arr;
    }

    function createFormData(...args) {
        const fd = new FormData();
        for (const arg of args) {
            fd.append(...arg);
        }
        return fd;
    }

    function createForm(str, ...args) {
        const form = document.createElement('form');
        str && (form.innerHTML = str);
        const fd = new FormData(form);
        for (const arg of args) {
            fd.append(...arg);
        }
        return fd;
    }

    it('get()', () => {
        expect(createForm('<input name=foo type=file>').has('foo')).toBe(true);
        expect(createForm('<input name=foo type=file>').get('foo').type).toBe('application/octet-stream');
        expect(createForm('', ['key', 'value1']).get('key')).toBe('value1');
        expect(createForm('', ['key', 'value2'], ['key', 'value1']).get('key')).toBe('value2');
        expect(createForm('', ['key', undefined]).get('key')).toBe('undefined');
        expect(createForm('', ['key', undefined], ['key', 'value1']).get('key')).toBe('undefined');
        expect(createForm('', ['key', null]).get('key')).toBe('null');
        expect(createForm('', ['key', null], ['key', 'value1']).get('key')).toBe('null');

        expect(createFormData(['key', 'value1']).get('key')).toBe('value1');
        expect(createFormData(['key', 'value2'], ['key', 'value1']).get('key')).toBe('value2');
        expect(createFormData(['key', undefined]).get('key')).toBe('undefined');
        expect(createFormData(['key', undefined], ['key', 'value1']).get('key')).toBe('undefined');
        expect(createFormData(['key', null]).get('key')).toBe('null');
        expect(createFormData(['key', null], ['key', 'value1']).get('key')).toBe('null');

        const fd = createFormData(['key', new Blob(), 'blank.txt']);
        const file = fd.get('key');
        expect(file.name).toBe('blank.txt');
        expect(file.type).toBe('');
        expect(file.size).toBe(0);
        // Chrome dose wrong...
        expect(fd.get('key')).toEqual(fd.get('key'));

        // Old ie don't have Symbol.toStringTag and the polyfill was
        // therefore not able to change the
        // `Object.prototype.toString.call` to return correct type of the polyfill
        // File constructor
        expect(createFormData(['key', new File([], 'doc.txt')]).get('key').name).toBe('doc.txt');
        expect(createFormData(['key', new Blob(), 'doc.txt']).get('key').name).toBe('doc.txt');
        expect(createFormData(['key', new Blob()]).get('key').name).toBe('blob');
    });

    it('has()', () => {
        // noinspection JSCheckFunctionSignatures
        expect(() => new FormData().has()).toThrowError();

        expect(createFormData(['n1', 'value']).has('n1')).toBeTrue();
        expect(createFormData(['n1', 'value']).has('n2')).toBeFalse();
        expect(createFormData(['n1', 'value'], ['n2', 'value']).has('n1')).toBeTrue();
        expect(createFormData(['n1', 'value'], ['n2', 'value']).has('n2')).toBeTrue();
        expect(createFormData(['n3', new Blob(['content'])]).has('n3')).toBeTrue();
    });

    it('entries()', () => {
        const fd = createFormData(
            ['keyA', 'val1'],
            ['keyA', 'val2'],
            ['keyB', 'val3'],
            ['keyA', 'val4']
        );

        expect(fromIterator(fd.keys())).toEqual(['keyA', 'keyA', 'keyB', 'keyA']);
        expect(fromIterator(fd.values())).toEqual(['val1', 'val2', 'val3', 'val4']);
        expect(fromIterator(fd.entries())).toEqual([
            ['keyA', 'val1'],
            ['keyA', 'val2'],
            ['keyB', 'val3'],
            ['keyA', 'val4'],
        ]);
    });

    it('set()', () => {
        // noinspection JSCheckFunctionSignatures
        expect(() => new FormData().set()).toThrowError();

        let fd;

        fd = createFormData(
            ['keyA', 'val1'],
            ['keyA', 'val2'],
            ['keyB', 'val3'],
            ['keyA', 'val4']
        );
        fd.set('keyA', 'val3');
        expect(fromIterator(fd.entries())).toEqual([['keyA', 'val3'], ['keyB', 'val3']]);

        fd = createFormData(['keyB', 'val3']);
        fd.set('keyA', 'val3');
        expect(fromIterator(fd.entries())).toEqual([['keyB', 'val3'], ['keyA', 'val3']]);
    });

    it('delete()', () => {
        // noinspection JSCheckFunctionSignatures
        expect(() => new FormData().delete()).toThrowError();

        let fd;
        fd = createFormData(['name', 'value']);
        expect(fd.has('name')).toBeTrue();
        fd.delete('name');
        expect(fd.has('name')).toBeFalse();
        fd.append('name', new Blob(['content']));
        expect(fd.has('name')).toBeTrue();
        fd.delete('name');
        expect(fd.has('name')).toBeFalse();

        fd.append('n1', 'v1');
        fd.append('n2', 'v2');
        fd.append('n1', 'v3');
        fd.delete('n1');
        expect(fd.has('n1')).toBeFalse();
        expect(fromIterator(fd.entries())).toEqual([['n2', 'v2']]);
    });

    it('linebreaks()', async () => {
        const form = document.createElement('form');
        const textarea = document.createElement('textarea');
        textarea.name = 'key';
        form.appendChild(textarea);

        textarea.value = '\n';
        expect(new FormData(form).get('key')).toMatch(/^\r?\n$/);
        textarea.value = '\r';
        expect(new FormData(form).get('key')).toMatch(/^\r?\n$/);
        textarea.value = 'a\n\ra\r\na\n\r\n\r\n\r\n\na\r\r';
        expect(new FormData(form).get('key')).toMatch(/^a(\r?\n)\1a\1a\1\1\1\1\1a\1\1$/);

        expect(createFormData(['key', '\n']).get('key')).toBe('\n');
        expect(createFormData(['key', '\r']).get('key')).toBe('\r');

        // chrome dose wrong...
        const fd = new FormData();
        fd.set('a', 'a\na');
        fd.set('b', 'b\rb');
        fd.set('c', 'c\n\rc');

        expect(fd.get('a')).toBe('a\na');
        expect(fd.get('b')).toBe('b\rb');
        expect(fd.get('c')).toBe('c\n\rc');

        window.Response && fd._blob && await new Response(fd._blob()).text().then(str => {
            expect(str).toContain('a\r\na');
            expect(str).toContain('b\r\nb');
            expect(str).toContain('c\r\n\r\nc');
        });
    });

    it('disabled()', () => {
        expect(createForm('<input disabled name=foo value=bar>').has('foo')).toBeFalse();
        expect(createForm('<fieldset disabled><input name=foo value=bar></fieldset>').has('foo')).toBeFalse();
        expect(createForm(`<select multiple name="example">
            <option selected disabled value="foo">Please choose one</option>
        </select>`).has('example')).toBeFalse();
    });

    it('selected options', () => {
        expect(fromIterator(createForm(`<select multiple name="example">
            <option selected value="volvo">Volvo</option>
            <option selected value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
        </select>`).entries())).toEqual([['example', 'volvo'], ['example', 'saab']]);
    });

    it('ignore submit buttons', () => {
        expect(fromIterator(createForm(`<input type="text" name="username" value="bob">
            <input type="submit" value="rename" name="action">
            <input type="submit" value="find_n_delete" name="action">`).entries())).toEqual([['username', 'bob']]);
    });

    it('send form data', () => {
        const formData = createFormData(['key', 'value1']);
        const xhr = new XMLHttpRequest();
        try {
            xhr.open('POST', 'https://www.baidu.com/');
        } catch {
            // TODO: throws "Access is denied" under IE9
            // REF: https://stackoverflow.com/questions/5793831/script5-access-is-denied-in-ie9-on-xmlhttprequest
            return; // skip
        }

        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.responseType = 'json';
        xhr.onload = () => {
            expect(xhr.response.headers['Content-Type']).toBe('text/plain');
        };
        xhr.send(formData);
    });

    window.Response && it('upload files', async () => {
        const kTestChars = 'ABC~‾¥≈¤･・•∙·☼★星🌟星★☼·∙•・･¤≈¥‾~XYZ';

        /**
         * formDataPostFileUploadTest - verifies multipart upload structure and
         * numeric character reference replacement for filenames, field names,
         * and field values using FormData and fetch().
         *
         * Uses /fetch/api/resources/echo-content.py to echo the upload
         * POST (unlike in send-file-form-helper.js, here we expect all
         * multipart/form-data request bodies to be UTF-8, so we don't need to
         * escape controls and non-ASCII bytes).
         *
         * Fields in the parameter object:
         *
         * - fileNameSource: purely explanatory and gives a clue about which
         *   character encoding is the source for the non-7-bit-ASCII parts of
         *   the fileBaseName, or Unicode if no smaller-than-Unicode source
         *   contains all the characters. Used in the test name.
         * - fileBaseName: the not-necessarily-just-7-bit-ASCII file basename
         *   used for the constructed test file. Used in the test name.
         */
        async function formDataPostFileUploadTest(fileBaseName) {
            const formData = new FormData();
            if (!formData._blob) return; // only test for the polyfill

            const file = new File([kTestChars], fileBaseName, {type : 'text/plain'});

            // Used to verify that the browser agrees with the test about
            // field value replacement and encoding independently of file system
            // idiosyncracies.
            formData.append('filename', fileBaseName);

            // Same, but with name and value reversed to ensure field names
            // get the same treatment.
            formData.append(fileBaseName, 'filename');

            formData.append('file', file, fileBaseName);

            const formDataText = await new Response(formData._blob()).text();
            const formDataLines = formDataText.split('\r\n');
            if (formDataLines.length && !formDataLines[formDataLines.length - 1]) {
                formDataLines.length--;
            }

            expect(formDataLines.length).toBeGreaterThan(2);

            const boundary = formDataLines[0];
            expect(formDataLines[formDataLines.length - 1]).toEqual(`${boundary}--`);

            const asValue = fileBaseName.replace(/\r\n?|\n/g, '\r\n');
            const asName = asValue.replace(/[\r\n"]/g, encodeURIComponent);
            const asFilename = fileBaseName.replace(/[\r\n"]/g, encodeURIComponent);
            const expectedText = [
                boundary,
                'Content-Disposition: form-data; name="filename"',
                '',
                asValue,
                boundary,
                `Content-Disposition: form-data; name="${asName}"`,
                '',
                'filename',
                boundary,
                'Content-Disposition: form-data; name="file"; '
                + `filename="${asFilename}"`,
                'Content-Type: text/plain',
                '',
                kTestChars,
                boundary + '--',
            ].join('\r\n');

            expect(formDataText.startsWith(expectedText)).toBeTrue();
        }

        await formDataPostFileUploadTest('file-for-upload-in-form.txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-\uF7F0\uF793\uF783\uF7A0.txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-â˜ºðŸ˜‚.txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-★星★.txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-☺😂.txt');
        await formDataPostFileUploadTest(`file-for-upload-in-form-${kTestChars}.txt`);

        await formDataPostFileUploadTest('file-for-upload-in-form.txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-NUL-[\0].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-BS-[\b].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-VT-[\v].txt');

        // These have characters that undergo processing in name=,
        // filename=, and/or value; formDataPostFileUploadTest postprocesses
        // expectedEncodedBaseName for these internally.
        await formDataPostFileUploadTest('file-for-upload-in-form-LF-[\n].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-LF-CR-[\n\r].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-CR-[\r].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-CR-LF-[\r\n].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-HT-[\t].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-FF-[\f].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-DEL-[\x7F].txt');

        // The rest should be passed through unmodified:
        await formDataPostFileUploadTest('file-for-upload-in-form-ESC-[\x1B].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-SPACE-[ ].txt');


        // These have characters that undergo processing in name=,
        // filename=, and/or value; formDataPostFileUploadTest postprocesses
        // expectedEncodedBaseName for these internally.
        await formDataPostFileUploadTest('file-for-upload-in-form-QUOTATION-MARK-[\x22].txt');
        await formDataPostFileUploadTest('"file-for-upload-in-form-double-quoted.txt"');
        await formDataPostFileUploadTest('file-for-upload-in-form-REVERSE-SOLIDUS-[\\].txt');

        // The rest should be passed through unmodified:
        await formDataPostFileUploadTest('file-for-upload-in-form-EXCLAMATION-MARK-[!].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-DOLLAR-SIGN-[$].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-PERCENT-SIGN-[%].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-AMPERSAND-[&].txt');
        await formDataPostFileUploadTest("file-for-upload-in-form-APOSTROPHE-['].txt");
        await formDataPostFileUploadTest('file-for-upload-in-form-LEFT-PARENTHESIS-[(].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-RIGHT-PARENTHESIS-[)].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-ASTERISK-[*].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-PLUS-SIGN-[+].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-COMMA-[,].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-FULL-STOP-[.].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-SOLIDUS-[/].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-COLON-[:].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-SEMICOLON-[;].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-EQUALS-SIGN-[=].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-QUESTION-MARK-[?].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-CIRCUMFLEX-ACCENT-[^].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-LEFT-SQUARE-BRACKET-[[].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-RIGHT-SQUARE-BRACKET-[]].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-LEFT-CURLY-BRACKET-[{].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-VERTICAL-LINE-[|].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-RIGHT-CURLY-BRACKET-[}].txt');
        await formDataPostFileUploadTest('file-for-upload-in-form-TILDE-[~].txt');
        await formDataPostFileUploadTest("'file-for-upload-in-form-single-quoted.txt'");
    });
});
