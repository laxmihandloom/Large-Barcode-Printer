import { describe, it, expect } from 'vitest';
import {
	SIZE_MAPPING,
	generateProductCode,
	sizeCodeFor,
	ageForSize,
	allAges,
	buildLabels,
	totalCopies
} from './barcode';
import { BarcodeMetadata } from './constants';

const item = (overrides: Partial<BarcodeMetadata> = {}): BarcodeMetadata => ({
	id: 'item-1',
	associatedField: 'SKU',
	value: 'SKU-1',
	itemName: 'Cotton Kurta Blue',
	quantity: 1,
	rate: 400,
	mrp: 500,
	sku: 'SKU-1',
	...overrides
});

describe('generateProductCode', () => {
	it('encodes the year and month it is given', () => {
		expect(generateProductCode(2025, 9)).toMatch(/^[A-Z]{3}Y25M09$/);
		expect(generateProductCode(2026, 12)).toMatch(/^[A-Z]{3}Y26M12$/);
	});

	it('zero-pads single digit months', () => {
		expect(generateProductCode(2025, 1).endsWith('M01')).toBe(true);
	});

	it('uses the last two digits of the year', () => {
		expect(generateProductCode(1999, 6)).toMatch(/Y99M06$/);
	});

	it('varies the random prefix between calls', () => {
		// Not a uniqueness guarantee - just that the prefix is not a constant.
		const codes = new Set(
			Array.from({ length: 50 }, () => generateProductCode(2025, 9).slice(0, 3))
		);
		expect(codes.size).toBeGreaterThan(1);
	});
});

describe('SIZE_MAPPING', () => {
	it('gives every size both a code and an age description', () => {
		for (const [label, [code, age]] of Object.entries(SIZE_MAPPING)) {
			expect(code, `code for ${label}`).toBeTruthy();
			expect(age, `age for ${label}`).toBeTruthy();
		}
	});

	it('separates group and size with a middot, since the template splits on it', () => {
		// BarcodeTemplate1 prints sizeLabel.split('·')[1], so a key without the
		// separator would render blank on a physical tag.
		for (const label of Object.keys(SIZE_MAPPING)) {
			expect(label, label).toContain('·');
			expect(label.split('·')[1].trim(), label).toBeTruthy();
		}
	});

	it('offers a deduplicated age list', () => {
		const ages = allAges();
		expect(new Set(ages).size).toBe(ages.length);
		expect(ages).toContain('Adult');
	});
});

describe('sizeCodeFor / ageForSize', () => {
	it('resolves a known size', () => {
		expect(sizeCodeFor('Kids · 12 (L)')).toBe('12 (L)');
		expect(ageForSize('Kids · 12 (L)')).toBe('6–9 months');
	});

	it('preselects the age for kids sizes 7 and 9', () => {
		expect(ageForSize('Kids · 7')).toBe('6-7 years');
		expect(ageForSize('Kids · 9')).toBe('8-9 years');
	});

	it('keeps the kids shirt sizes 12-18 on their existing age groups', () => {
		// These numbers also appear as infant sizes on the shop's size chart.
		// Overwriting them here would mislabel older kids' shirts.
		expect(ageForSize('Kids · 12')).toBe('10-11 years');
		expect(ageForSize('Kids · 14')).toBe('11-12 years');
		expect(ageForSize('Kids · 16')).toBe('12-13 years');
		expect(ageForSize('Kids · 18')).toBe('13-14 years');
	});

	it('preselects infant ages for the Baby sizes', () => {
		expect(ageForSize('Baby · 12')).toBe('0 months');
		expect(ageForSize('Baby · 14')).toBe('0-3 months');
		expect(ageForSize('Baby · 16')).toBe('3-6 months');
		expect(ageForSize('Baby · 18')).toBe('6–9 months');
		expect(ageForSize('Baby · 1')).toBe('6 months - 1 year');
	});

	it('keeps Baby and Kids entries for the same number distinct', () => {
		// The shop's chart reuses 12/14/16/18 for infants; both must survive.
		for (const n of ['12', '14', '16', '18']) {
			expect(ageForSize(`Baby · ${n}`)).not.toBe(ageForSize(`Kids · ${n}`));
			expect(sizeCodeFor(`Baby · ${n}`)).toBe(n);
			expect(sizeCodeFor(`Kids · ${n}`)).toBe(n);
		}
	});

	it('reuses the existing 6–9 months entry rather than adding a lookalike', () => {
		// A hyphen variant would sit next to the en-dash one in the dropdown,
		// two near-identical options for the same age group.
		const nineMonthEntries = allAges().filter((age) => /^6.9 months$/.test(age));
		expect(nineMonthEntries).toHaveLength(1);
	});

	it('returns empty strings for unknown or missing sizes', () => {
		expect(sizeCodeFor('Nonexistent')).toBe('');
		expect(ageForSize(undefined)).toBe('');
		expect(sizeCodeFor('')).toBe('');
	});
});

describe('buildLabels', () => {
	const stubCode = (id: string, year: number, month: number) => `${id}-${year}-${month}`;
	const defaults = { year: 2026, month: 3 };

	it('produces one design per item, not one per copy', () => {
		const labels = buildLabels(
			[item({ id: 'a', quantity: 10 }), item({ id: 'b', quantity: 5 })],
			defaults,
			stubCode
		);
		expect(labels).toHaveLength(2);
		expect(labels.map((l) => l.copies)).toEqual([10, 5]);
		expect(totalCopies(labels)).toBe(15);
	});

	it('gives every copy of an item the same code', () => {
		const labels = buildLabels([item({ quantity: 20 })], defaults, stubCode);
		expect(labels[0].copies).toBe(20);
		expect(labels[0].uniqueCode).toBe('item-1-2026-3');
	});

	it('falls back to the default year and month when none is selected', () => {
		const labels = buildLabels([item()], defaults, stubCode);
		expect(labels[0].uniqueCode).toBe('item-1-2026-3');
	});

	it('prefers the per-item year and month when set', () => {
		const labels = buildLabels(
			[item({ selectedYear: 2024, selectedMonth: 11 })],
			defaults,
			stubCode
		);
		expect(labels[0].uniqueCode).toBe('item-1-2024-11');
	});

	it('resolves the size code from the mapping', () => {
		const labels = buildLabels(
			[item({ selectedSize: 'Adult · XL', selectedAge: 'Adult' })],
			defaults,
			stubCode
		);
		expect(labels[0].sizeLabel).toBe('Adult · XL');
		expect(labels[0].sizeCode).toBe('XL');
		expect(labels[0].age).toBe('Adult');
	});

	it('coerces a blank or invalid quantity to one copy', () => {
		// The copies field is a free-text number input, so it can arrive as ''.
		const labels = buildLabels(
			[item({ quantity: '' as unknown as number }), item({ id: 'z', quantity: 0 })],
			defaults,
			stubCode
		);
		expect(labels.map((l) => l.copies)).toEqual([1, 1]);
	});

	it('calls codeFor once per item', () => {
		const calls: string[] = [];
		buildLabels(
			[item({ id: 'a', quantity: 50 }), item({ id: 'b', quantity: 50 })],
			defaults,
			(id, y, m) => {
				calls.push(id);
				return `${id}-${y}-${m}`;
			}
		);
		expect(calls).toEqual(['a', 'b']);
	});
});
