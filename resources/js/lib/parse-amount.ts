import { formatRupiah } from './format';

/**
 * Parse Indonesian shorthand amounts into plain rupiah integers:
 *   "150rb" / "150 ribu" / "150k"  -> 150000
 *   "1,5jt" / "1.5jt" / "2jt"      -> 1500000 / 1500000 / 2000000
 *   "150.000" / "150000" / "Rp 250.000" -> as-is
 * Returns null when the input cannot be understood.
 */
export function parseAmountInput(raw: string): number | null {
    if (!raw) return null;

    const s = raw.trim().toLowerCase().replace(/^rp\s*/, '').replace(/\s+/g, '');
    if (!s) return null;

    const suffixed = s.match(/^([\d.,]+)(rb|ribu|jt|juta|k)$/);
    if (suffixed) {
        const normalized = suffixed[1].replace(',', '.');
        const parts = normalized.split('.');
        const numStr =
            parts.length > 1 ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1] : normalized;
        const num = parseFloat(numStr);
        if (Number.isNaN(num)) return null;

        const multiplier = suffixed[2] === 'jt' || suffixed[2] === 'juta' ? 1_000_000 : 1_000;

        return Math.round(num * multiplier);
    }

    if (/^[0-9.,]+$/.test(s)) {
        const digits = s.replace(/[.,]/g, '');

        return digits ? parseInt(digits, 10) : null;
    }

    return null;
}

/** "Rp 1.500.000" preview for a raw amount input, or null when unparseable. */
export function formatAmountPreview(raw: string): string | null {
    const value = parseAmountInput(raw);

    return value === null ? null : `Rp ${formatRupiah(value)}`;
}
