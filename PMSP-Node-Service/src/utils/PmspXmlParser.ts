import { XMLParser } from 'fast-xml-parser';

export class PmspXmlParser {
    private readonly parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseTagValue: true,
            trimValues: true,
            removeNSPrefix: true, // importante para ignorar prefixos como soap:, ns1:, etc.
        });
    }

    public parse(xml: string): any {
        if (!xml || typeof xml !== 'string') {
            throw new Error('XML inválido para parsing.');
        }

        return this.parser.parse(xml);
    }

    public findFirst(obj: any, tagName: string): any {
        if (obj == null || typeof obj !== 'object') return undefined;

        if (Object.prototype.hasOwnProperty.call(obj, tagName)) {
            return obj[tagName];
        }

        for (const key of Object.keys(obj)) {
            const value = obj[key];

            if (Array.isArray(value)) {
                for (const item of value) {
                    const found = this.findFirst(item, tagName);
                    if (found !== undefined) return found;
                }
            } else if (value && typeof value === 'object') {
                const found = this.findFirst(value, tagName);
                if (found !== undefined) return found;
            }
        }

        return undefined;
    }

    public findAll(obj: any, tagName: string): any[] {
        const results: any[] = [];
        this.walkAndCollect(obj, tagName, results);
        return results;
    }

    private walkAndCollect(obj: any, tagName: string, results: any[]): void {
        if (obj == null || typeof obj !== 'object') return;

        if (Object.prototype.hasOwnProperty.call(obj, tagName)) {
            results.push(obj[tagName]);
        }

        for (const key of Object.keys(obj)) {
            const value = obj[key];

            if (Array.isArray(value)) {
                for (const item of value) {
                    this.walkAndCollect(item, tagName, results);
                }
            } else if (value && typeof value === 'object') {
                this.walkAndCollect(value, tagName, results);
            }
        }
    }

    public asArray<T>(value: T | T[] | undefined): T[] {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }
}
