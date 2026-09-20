import { describe, it, expect } from 'vitest';
import { fitNameFontSize } from './BarcodeTemplate1';

describe('fitNameFontSize', () => {
	it('keeps the full size for short names', () => {
		expect(fitNameFontSize(['COTTON KURTA', 'BLUE'])).toBe(36);
	});

	it('shrinks as the longest line grows', () => {
		const short = fitNameFontSize(['SHORT', '']);
		const long = fitNameFontSize(['A VERY LONG PRODUCT NAME INDEED', '']);
		expect(long).toBeLessThan(short);
	});

	it('never drops below the readable floor', () => {
		const huge = 'X'.repeat(200);
		expect(fitNameFontSize([huge, huge])).toBe(18);
	});

	it('sizes on the longest line, not the first', () => {
		const lines = ['AB', 'A MUCH LONGER SECOND LINE HERE'];
		expect(fitNameFontSize(lines)).toBe(fitNameFontSize([lines[1]]));
	});

	it('handles an empty name', () => {
		expect(fitNameFontSize(['', ''])).toBe(36);
	});

	it('keeps the estimated width inside the template', () => {
		const line = 'COTTON KURTA PYJAMA SET';
		const size = fitNameFontSize([line]);
		expect(line.length * 0.62 * size).toBeLessThanOrEqual(370);
	});
});
