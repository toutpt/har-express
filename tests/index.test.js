const rewire = require("rewire");
const har = rewire('../');

describe('har', () => {
    describe('mergeHAR', () => {
        it('should merge HAR', () => {
            const mergeHAR = har.__get__('mergeHAR');
            const HAR1 = {
                log: {
                    entries: [
                        {foo: 'foo'}
                    ]
                }
            };
            const HAR2 = {
                log: {
                    entries: [
                        {bar: 'bar'}
                    ]
                }
            }
            const merged = mergeHAR(HAR1, HAR2);
            expect(merged.log.entries.length).toBe(2);
            expect(merged.log.entries[0].foo).toBe('foo');
            expect(merged.log.entries[1].bar).toBe('bar');
        });
    });
    describe('parse', () => {
        it('should return an HAR data structure', () => {
            const parse = har.__get__('parse');
            const content = parse(`${__dirname}/test.har`);
            expect(content.log.entries.length).toBe(5);
        });
    });
    describe('filter', () => {
        const parse = har.__get__('parse');
        let content;
        beforeEach(() => {
            content = parse(`${__dirname}/test.har`);
        });
        it('should return a list of corresponding entry', () => {
            const filter = har.__get__('filter');
            const entries = filter(content, {
                path: '/foo', method: 'GET'
            });
            expect(entries.length).toBe(1);
        });
        it('should support queryString', () => {
            // given
            const filter = har.__get__('filter');
            // when filter on search without queryString
            let entries = filter(content, {
                path: '/search', method: 'GET', params: {},
            });
            expect(entries.length).toBe(2);
            // when filter on search with queryString
            entries = filter(content, {
                path: '/search', method: 'GET', params: {
                    type: 'foo'
                },
            });
            expect(entries.length).toBe(1);
        });
        it('should support same body', () => {
            const filter = har.__get__('filter');
            let entries = filter(content, {
                path: '/search', method: 'POST', params: {}, body: '{\"q\": \"second\"}'
            });
            expect(entries.length).toBe(1);
        });

    });
});
