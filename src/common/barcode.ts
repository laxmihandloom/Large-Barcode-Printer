import { Barcode, BarcodeMetadata } from './constants';

// One distinct label design, plus how many identical copies of it to print.
export type LabelDesign = Barcode & { id: string; copies: number };

// Size mapping constant: [code, age/description]
export const SIZE_MAPPING: Record<string, [string, string]> = {
	// BABY
	// These numbers also exist as KIDS SHIRT sizes further down, where they mean
	// 10-14 year olds. They are a separate group so infant garments and older
	// kids' shirts can both be tagged correctly.
	"Baby · 12": ["12", "0 months"],
	"Baby · 14": ["14", "0-3 months"],
	"Baby · 16": ["16", "3-6 months"],
	"Baby · 18": ["18", "6–9 months"],
	"Baby · 1": ["1", "6 months - 1 year"],

	// KIDS T-SHIRT
	"Kids · 0": ["0", "0 months"],
	"Kids · S": ["S", "0-3 months"],
	"Kids · M": ["M", "3-6 months"],
	"Kids · 12 (L)": ["12 (L)", "6–9 months"],
	"Kids · 14 (XL)": ["14 (XL)", "1-1.5 years"],
	"Kids · 40cm (16in)": ["40cm (16in)", "1.5-2 years"],
	"Kids · 45cm (18in)": ["45cm (18in)", "2-3 years"],
	"Kids · 50cm (20in)": ["50cm (20in)", "3–4 years"],
	"Kids · 55cm (22in)": ["55cm (22in)", "4-5 years"],
	"Kids · 60cm (24in)": ["60cm (24in)", "5–6 years"],
	"Kids · 65cm (26in)": ["65cm (26in)", "6-7 years"],
	"Kids · 70cm (28in)": ["70cm (28in)", "7-8 years"],
	"Kids · 75cm (30in)": ["75cm (30in)", "8-10 years"],
	"Kids · 80cm (32in)": ["80cm (32in)", "10–11 years"],
	"Kids · 85cm (34in)": ["85cm (34in)", "11–12 years"],
	"Kids · 90cm (36in)": ["90cm (36in)", "12-13 years"],

	// KIDS BOTTOM
	"Kids · 20W": ["20W", "2-3 years"],
	"Kids · 22W": ["22W", "3-4 years"],
	"Kids · 24W": ["24W", "4-5 years"],
	"Kids · 26W": ["26W", "5-6 years"],
	"Kids · 28W": ["28W", "6-7 years"],
	"Kids · 30W": ["30W", "8-9 years"],
	"Kids · 32W": ["32W", "9-10 years"],
	"Kids · 34W": ["34W", "10-11 years"],
	"Kids · 36W": ["36W", "11-12 years"],
	"Kids · 38W": ["38W", "12-13 years"],
	"Kids · 40W": ["40W", "13-14 years"],

	// KIDS SHIRT
	"Kids · 2": ["2", "2-3 years"],
	"Kids · 3": ["3", "3-4 years"],
	"Kids · 4": ["4", "4-5 years"],
	"Kids · 5": ["5", "5- 6 years"],
	"Kids · 6": ["6", "6-7 years"],
	"Kids · 7": ["7", "6-7 years"],
	"Kids · 8": ["8", "7-8 years"],
	"Kids · 9": ["9", "8-9 years"],
	"Kids · 10": ["10", "9-10 years"],
	"Kids · 12": ["12", "10-11 years"],
	"Kids · 14": ["14", "11-12 years"],
	"Kids · 16": ["16", "12-13 years"],
	"Kids · 18": ["18", "13-14 years"],

	// ADULTS TOP
	"Adult · XS": ["XS", "Adult"],
	"Adult · S": ["S", "Adult"],
	"Adult · M": ["M", "Adult"],
	"Adult · L": ["L", "Adult"],
	"Adult · XL": ["XL", "Adult"],
	"Adult · XXL": ["XXL", "Adult"],
	"Adult · 3XL": ["3XL", "Adult"],

	// ADULTS BOTTOM
	"Adult · 26W": ["26W", "Adult"],
	"Adult · 28W": ["28W", "Adult"],
	"Adult · 30W": ["30W", "Adult"],
	"Adult · 32W": ["32W", "Adult"],
	"Adult · 34W": ["34W", "Adult"],
	"Adult · 36W": ["36W", "Adult"],
	"Adult · 38W": ["38W", "Adult"],
	"Adult · 40W": ["40W", "Adult"],
	"Adult · 42W": ["42W", "Adult"]
};

// Generate a product code based on selected year and month.
// Format: [3 random chars][Y][YY][M][MM]  e.g. PTUY25M09
// The code exists only to let staff read the purchase date off a tag; it is
// not an identifier and is deliberately not unique per label.
export const generateProductCode = (year: number, month: number): string => {
	const randomChars = Array.from({ length: 3 }, () =>
		String.fromCharCode(65 + Math.floor(Math.random() * 26))
	).join('');

	const yearStr = year.toString().slice(-2);
	const monthStr = month.toString().padStart(2, '0');

	return `${randomChars}Y${yearStr}M${monthStr}`;
};

// The short code printed in the SIZE box, e.g. "Kids · 12 (L)" -> "12 (L)".
export const sizeCodeFor = (sizeLabel?: string): string =>
	sizeLabel && SIZE_MAPPING[sizeLabel] ? SIZE_MAPPING[sizeLabel][0] : '';

// The age description a size implies, e.g. "Kids · 12 (L)" -> "6–9 months".
export const ageForSize = (sizeLabel?: string): string =>
	sizeLabel && SIZE_MAPPING[sizeLabel] ? SIZE_MAPPING[sizeLabel][1] : '';

// Every distinct age description offered in the Age dropdown.
export const allAges = (): string[] =>
	Array.from(new Set(Object.values(SIZE_MAPPING).map((entry) => entry[1])));

// Collapse the per-item metadata into one label design per item, carrying the
// number of copies rather than repeating the design. Copies of an item are
// identical, which is what lets the PDF rasterise each design only once.
//
// `codeFor` is injected so the caller can cache codes across renders; it is
// called once per item.
export const buildLabels = (
	metadata: BarcodeMetadata[],
	defaults: { year: number; month: number },
	codeFor: (id: string, year: number, month: number) => string
): LabelDesign[] =>
	metadata.map((item) => {
		const year = item.selectedYear || defaults.year;
		const month = item.selectedMonth || defaults.month;
		return {
			id: item.id,
			copies: Math.max(1, Number(item.quantity) || 1),
			itemName: item.itemName,
			value: item.value,
			rate: item.rate,
			mrp: item.mrp,
			sizeLabel: item.selectedSize || '',
			sizeCode: sizeCodeFor(item.selectedSize),
			age: item.selectedAge || '',
			uniqueCode: codeFor(item.id, year, month),
			sku: item.sku
		};
	});

// Total number of printed pages a set of label designs produces.
export const totalCopies = (labels: LabelDesign[]): number =>
	labels.reduce((sum, label) => sum + label.copies, 0);
