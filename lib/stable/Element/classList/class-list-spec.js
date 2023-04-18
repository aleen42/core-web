describe('classList', () => {
    beforeAll(async () => {
        await require('./index.js');
    });

    it('Adds a class', () => {
        const cList = document.createElement('p').classList;
        cList.toggle('c1');
        expect(cList.contains('c1')).toBe(true);
        expect(cList.toggle('c2')).toBe(true);
    });

    it('Removes a class', () => {
        const cList = document.createElement('p').classList;

        cList.add('c1');
        cList.toggle('c1');
        expect(cList.contains('c1')).toBe(false);

        cList.add('c2');
        expect(cList.toggle('c2')).toBe(false);
    });

    it('Adds class with second argument', () => {
        const cList = document.createElement('p').classList;

        cList.toggle('c1', true);
        expect(cList.contains('c1')).toBe(true);

        expect(cList.toggle('c2', true)).toBe(true);

        cList.add('c3');
        cList.toggle('c3', true);
        expect(cList.contains('c3')).toBe(true);

        cList.add('c4');
        expect(cList.toggle('c4', true)).toBe(true);
    });

    it('Removes class with second argument', () => {
        var cList = document.createElement('p').classList;

        cList.add('c1');
        cList.toggle('c1', false);
        expect(cList.contains('c1')).toBe(false);

        expect(cList.toggle('c2', false)).toBe(false);

        cList.toggle('c3', false);
        expect(cList.contains('c3')).toBe(false);

        expect(cList.toggle('c4', false)).toBe(false);
    });
});
